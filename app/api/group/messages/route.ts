import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// GET: Fetch messages and verify member access
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const group = searchParams.get('group');
  const username = searchParams.get('username');

  if (!group || !username) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const metaKey = `group:${group}:meta`;
  const meta: any = await redis.get(metaKey);

  if (!meta) {
    return NextResponse.json({ error: 'Group does not exist or has been deleted.' }, { status: 404 });
  }

  const isCreator = meta.creator === username;
  const isMember = meta.members.includes(username);

  if (!isCreator && !isMember) {
    return NextResponse.json({ error: 'Access Denied: You are not a member of this group.' }, { status: 403 });
  }

  const messages = (await redis.get(`group:${group}:messages`)) || [];
  return NextResponse.json({ messages, members: [meta.creator, ...meta.members] }, { status: 200 });
}

// POST: Handle registration, group creation, messaging, leaving, and complete logout data wipe
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, group, username, members, text } = body;

    // Action 0: Register User on Login
    if (action === 'register') {
      if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });
      await redis.sadd('users:registered', username);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Action 1: Create Group (Validates registered members)
    if (action === 'create') {
      if (!group || !username) {
        return NextResponse.json({ error: 'Missing group name or username' }, { status: 400 });
      }

      const metaKey = `group:${group}:meta`;
      const existingMeta = await redis.get(metaKey);
      if (existingMeta) {
        return NextResponse.json({ error: 'Group name already taken!' }, { status: 400 });
      }

      const memberArray = members 
        ? members.split(',').map((m: string) => m.trim().replace(/^@/, '')).filter(Boolean)
        : [];

      for (const member of memberArray) {
        const isRegistered: any = await redis.sismember('users:registered', member);
        if (!isRegistered) {
          return NextResponse.json({ error: `User '@${member}' is not registered in the system!` }, { status: 400 });
        }
      }

      const filteredMembers = memberArray.filter((m: string) => m !== username);

      await redis.set(metaKey, {
        creator: username,
        members: filteredMembers,
        createdAt: Date.now()
      });
      await redis.set(`group:${group}:messages`, []);

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Action 2: Send Message
    if (action === 'send') {
      if (!group || !username || !text) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const metaKey = `group:${group}:meta`;
      const meta: any = await redis.get(metaKey);
      if (!meta) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      if (meta.creator !== username && !meta.members.includes(username)) {
        return NextResponse.json({ error: 'Unauthorized to post' }, { status: 403 });
      }

      const msgKey = `group:${group}:messages`;
      const messages: any = (await redis.get(msgKey)) || [];

      const newMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: username,
        text,
        timestamp: Date.now(),
      };

      messages.push(newMessage);
      await redis.set(msgKey, messages);

      return NextResponse.json({ success: true, message: newMessage }, { status: 200 });
    }

    // Action 3: Leave Group
    if (action === 'leave') {
      if (!group || !username) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      const metaKey = `group:${group}:meta`;
      const msgKey = `group:${group}:messages`;
      const meta: any = await redis.get(metaKey);

      if (!meta) return NextResponse.json({ success: true }, { status: 200 });

      if (meta.creator === username) {
        if (meta.members.length > 0) {
          meta.creator = meta.members.shift();
          await redis.set(metaKey, meta);
        } else {
          await redis.del(metaKey);
          await redis.del(msgKey);
        }
      } else {
        meta.members = meta.members.filter((m: string) => m !== username);
        await redis.set(metaKey, meta);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Action 4: Logout & Full Data Wipe (Removes registration, removes from groups, deletes user's messages)
    if (action === 'logout') {
      if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

      // 1. Remove from global registered users
      await redis.srem('users:registered', username);

      // 2. Scan all active groups to clean up membership and delete messages sent by this user
      const metaKeys: string[] = (await redis.keys('group:*:meta')) || [];

      for (const metaKey of metaKeys) {
        const groupName = metaKey.replace(/^group:/, '').replace(/:meta$/, '');
        const meta: any = await redis.get(metaKey);
        const msgKey = `group:${groupName}:messages`;

        if (!meta) continue;

        // Filter out all messages sent by this logging-out user
        let messages: any = (await redis.get(msgKey)) || [];
        messages = messages.filter((m: any) => m.sender !== username);
        await redis.set(msgKey, messages);

        // Handle creator vs member cleanup
        if (meta.creator === username) {
          if (meta.members.length > 0) {
            meta.creator = meta.members.shift();
            await redis.set(metaKey, meta);
          } else {
            await redis.del(metaKey);
            await redis.del(msgKey);
          }
        } else if (meta.members.includes(username)) {
          meta.members = meta.members.filter((m: string) => m !== username);
          await redis.set(metaKey, meta);
        }
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete message
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');
    const messageId = searchParams.get('messageId');
    const username = searchParams.get('username');

    if (!group || !messageId || !username) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const msgKey = `group:${group}:messages`;
    let messages: any = (await redis.get(msgKey)) || [];

    const messageIndex = messages.findIndex((m: any) => m.id === messageId);
    if (messageIndex === -1) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (messages[messageIndex].sender !== username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    messages.splice(messageIndex, 1);
    await redis.set(msgKey, messages);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}