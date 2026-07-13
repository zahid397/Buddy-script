import { PrismaClient, PostVisibility } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Only these 5 accounts are ever touched by this script. Any other user
// (e.g. one you registered yourself while testing) and their content is
// never deleted or modified — this script only refreshes its own demo data.
const SEED_EMAILS = [
  'dylan@buddyscript.dev',
  'karim@buddyscript.dev',
  'radovan@buddyscript.dev',
  'maya@buddyscript.dev',
  'alex@buddyscript.dev',
] as const;

const AVATARS = [
  '/assets/js/images/profile.png',
  '/assets/js/images/post_img.png',
  '/assets/js/images/txt_img.png',
  '/assets/js/images/people1.png',
  '/assets/js/images/people2.png',
];

const COVERS = [
  '/assets/js/images/profile-cover-img.png',
  '/assets/js/images/profile-cover-img.png',
  '/assets/js/images/profile-cover-img.png',
  '/assets/js/images/profile-cover-img.png',
  '/assets/js/images/profile-cover-img.png',
];

const POST_IMAGES = [
  '/assets/js/images/timeline_img.png',
  '/assets/js/images/img1.png',
  '/assets/js/images/img2.png',
  '/assets/js/images/img3.png',
  '/assets/js/images/img4.png',
  '/assets/js/images/photos1.png',
  '/assets/js/images/photos2.png',
  '/assets/js/images/photos3.png',
  '/assets/js/images/f1.png',
  '/assets/js/images/f2.png',
];

const POST_TEXTS = [
  'Healthy Tracking App — finally shipped the v2 redesign today. Feedback welcome!',
  'Coffee, code, repeat. Working through a gnarly caching bug this morning.',
  'Weekend hike recap — the trail views were unreal this time of year.',
  'Just wrapped up a great pairing session on the new onboarding flow.',
  'Reading list update: three books deep into the backlog this month.',
  'Shipped a tiny performance win today — feed load time down 40%.',
  'Team offsite photos incoming. Great few days with everyone.',
  'Experimenting with a new design system token set. Thoughts?',
  'Late night debugging session finally paid off. Root cause: a stale cache key.',
  'Excited to share a small side project I have been tinkering with.',
  'Grabbed lunch with the team to celebrate the launch. Well earned.',
  'New setup, same bugs. Productivity is a mindset, not a monitor.',
  'Trying out a new note-taking workflow this week.',
  'Retro takeaway: smaller PRs, faster reviews, happier team.',
  'Finally automated the deploy pipeline end to end.',
  'A quiet Sunday spent refactoring old code — oddly relaxing.',
  'Big thanks to everyone who joined the design critique today.',
  'Exploring a new city this week, work-from-anywhere in full effect.',
  'Milestone unlocked: 100 commits into the new project.',
  'Sketching out ideas for next quarter — lots to be excited about.',
  'Onboarded two new teammates today, great additions to the crew.',
  'Revisiting an old feature request that finally makes sense to build now.',
];

const COMMENT_TEXTS = [
  'This is awesome, congrats!',
  'It is a long established fact that a reader will be distracted by readable content.',
  'Love this, thanks for sharing.',
  'Great work, keep it up!',
  'Really needed to see this today.',
  'Nice, how long did that take you?',
  'This made my day.',
];

const REPLY_TEXTS = [
  'Totally agree with this.',
  'Thanks for the kind words!',
  'Haha exactly my thoughts.',
  'Appreciate you saying that.',
];

const BIOS = [
  'Building things at Buddy Script. Coffee-powered.',
  'Product designer turned full-stack tinkerer.',
  'Sharing what I learn as I learn it.',
  'Hiking, hacking, occasionally both at once.',
  'Here for the good conversations.',
];

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Upserting seed users...');
  const password = await bcrypt.hash('Password123!', 12);

  const userDefs = [
    { firstName: 'Dylan', lastName: 'Field', email: SEED_EMAILS[0] },
    { firstName: 'Karim', lastName: 'Saif', email: SEED_EMAILS[1] },
    { firstName: 'Radovan', lastName: 'SkillArena', email: SEED_EMAILS[2] },
    { firstName: 'Maya', lastName: 'Chen', email: SEED_EMAILS[3] },
    { firstName: 'Alex', lastName: 'Morgan', email: SEED_EMAILS[4] },
  ];

  const users = [];
  for (let i = 0; i < userDefs.length; i++) {
    const u = await prisma.user.upsert({
      where: { email: userDefs[i].email },
      update: {
        firstName: userDefs[i].firstName,
        lastName: userDefs[i].lastName,
        avatarUrl: AVATARS[i % AVATARS.length],
        coverImageUrl: COVERS[i % COVERS.length],
        bio: BIOS[i % BIOS.length],
        isDemoAccount: true,
      },
      create: {
        ...userDefs[i],
        password,
        avatarUrl: AVATARS[i % AVATARS.length],
        coverImageUrl: COVERS[i % COVERS.length],
        bio: BIOS[i % BIOS.length],
        isDemoAccount: true,
      },
    });
    users.push(u);
  }
  const seedUserIds = users.map((u) => u.id);

  console.log('Clearing previous seed-owned content (leaves any other account untouched)...');
  await prisma.replyLike.deleteMany({ where: { OR: [{ userId: { in: seedUserIds } }, { reply: { userId: { in: seedUserIds } } }] } });
  await prisma.commentLike.deleteMany({ where: { OR: [{ userId: { in: seedUserIds } }, { comment: { userId: { in: seedUserIds } } }] } });
  await prisma.like.deleteMany({ where: { OR: [{ userId: { in: seedUserIds } }, { post: { userId: { in: seedUserIds } } }] } });
  await prisma.reply.deleteMany({ where: { OR: [{ userId: { in: seedUserIds } }, { comment: { userId: { in: seedUserIds } } }] } });
  await prisma.comment.deleteMany({ where: { OR: [{ userId: { in: seedUserIds } }, { post: { userId: { in: seedUserIds } } }] } });
  await prisma.post.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.friendRequest.deleteMany({ where: { OR: [{ senderId: { in: seedUserIds } }, { receiverId: { in: seedUserIds } }] } });
  await prisma.friendship.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.follow.deleteMany({ where: { OR: [{ followerId: { in: seedUserIds } }, { followingId: { in: seedUserIds } }] } });
  await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: seedUserIds } }, { receiverId: { in: seedUserIds } }] } });
  await prisma.notification.deleteMany({ where: { OR: [{ userId: { in: seedUserIds } }, { actorId: { in: seedUserIds } }] } });
  await prisma.eventAttendee.deleteMany({ where: { OR: [{ userId: { in: seedUserIds } }, { event: { createdById: { in: seedUserIds } } }] } });
  await prisma.event.deleteMany({ where: { createdById: { in: seedUserIds } } });

  console.log('Seeding posts...');
  const posts = [];
  for (let i = 0; i < POST_TEXTS.length; i++) {
    const author = users[i % users.length];
    const hasImage = i % 2 === 0;
    const visibility: PostVisibility = i < users.length ? 'PRIVATE' : Math.random() < 0.15 ? 'FRIENDS' : 'PUBLIC';
    const post = await prisma.post.create({
      data: {
        content: POST_TEXTS[i],
        imageUrl: hasImage ? POST_IMAGES[i % POST_IMAGES.length] : null,
        visibility,
        userId: (i < users.length ? users[i] : author).id,
        createdAt: new Date(Date.now() - i * 1000 * 60 * 37),
      },
    });
    posts.push(post);
  }

  console.log('Seeding likes, comments, replies...');
  for (const post of posts) {
    const likers = pick(users, Math.floor(Math.random() * users.length));
    for (const liker of likers) {
      await prisma.like.create({ data: { userId: liker.id, postId: post.id } });
    }

    const commentCount = Math.random() < 0.7 ? Math.ceil(Math.random() * 3) : 0;
    for (let c = 0; c < commentCount; c++) {
      const commenter = randomOf(users);
      const comment = await prisma.comment.create({
        data: {
          content: randomOf(COMMENT_TEXTS),
          userId: commenter.id,
          postId: post.id,
          createdAt: new Date(post.createdAt.getTime() + (c + 1) * 1000 * 60 * 5),
        },
      });

      const commentLikers = pick(users, Math.floor(Math.random() * users.length));
      for (const liker of commentLikers) {
        await prisma.commentLike.create({ data: { userId: liker.id, commentId: comment.id } });
      }

      const replyCount = Math.random() < 0.5 ? Math.ceil(Math.random() * 2) : 0;
      for (let r = 0; r < replyCount; r++) {
        const replier = randomOf(users);
        const reply = await prisma.reply.create({
          data: {
            content: randomOf(REPLY_TEXTS),
            userId: replier.id,
            commentId: comment.id,
            createdAt: new Date(comment.createdAt.getTime() + (r + 1) * 1000 * 60 * 3),
          },
        });

        const replyLikers = pick(users, Math.floor(Math.random() * users.length));
        for (const liker of replyLikers) {
          await prisma.replyLike.create({ data: { userId: liker.id, replyId: reply.id } });
        }
      }
    }
  }

  console.log('Seeding friend requests, friendships, follows...');
  // Dylan <-> Karim, Dylan <-> Maya are already friends
  const friendPairs: [number, number][] = [
    [0, 1],
    [0, 3],
  ];
  for (const [a, b] of friendPairs) {
    await prisma.friendship.create({ data: { userId: users[a].id, friendId: users[b].id } });
    await prisma.friendship.create({ data: { userId: users[b].id, friendId: users[a].id } });
  }
  // Radovan -> Dylan pending friend request
  await prisma.friendRequest.create({ data: { senderId: users[2].id, receiverId: users[0].id, status: 'PENDING' } });
  // Alex -> Maya pending friend request
  await prisma.friendRequest.create({ data: { senderId: users[4].id, receiverId: users[3].id, status: 'PENDING' } });

  // Follows (asymmetric, unlike friendships)
  const followPairs: [number, number][] = [
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [0, 3],
    [2, 3],
  ];
  for (const [followerIdx, followingIdx] of followPairs) {
    await prisma.follow.create({ data: { followerId: users[followerIdx].id, followingId: users[followingIdx].id } });
  }

  console.log('Seeding events...');
  const events = [
    { title: 'Buddy Script community meetup', location: 'Downtown Hub', daysOut: 5, createdBy: users[0] },
    { title: 'Design systems roundtable', location: 'Online', daysOut: 12, createdBy: users[3] },
  ];
  for (const e of events) {
    const event = await prisma.event.create({
      data: {
        title: e.title,
        description: 'Join fellow Buddy Script members for an evening of talks and networking.',
        coverImageUrl: '/assets/js/images/feed_event1.png',
        location: e.location,
        eventDate: new Date(Date.now() + e.daysOut * 24 * 60 * 60 * 1000),
        createdById: e.createdBy.id,
      },
    });
    const attendees = pick(users, 3);
    for (const a of attendees) {
      await prisma.eventAttendee.create({ data: { eventId: event.id, userId: a.id } });
    }
  }

  console.log('Seeding groups...');
  const GROUPS = [
    { name: 'Web Developers Hub', description: 'Frontend, backend, and everything in between.' },
    { name: 'UI/UX Community', description: 'Design critiques, portfolio feedback, and process talk.' },
    { name: 'Godot Game Developers', description: 'Building games with the Godot engine, from jam entries to full releases.' },
    { name: 'AI & Machine Learning', description: 'Papers, projects, and practical ML engineering.' },
    { name: 'Career Growth Network', description: 'Interview prep, resume swaps, and career pivots.' },
    { name: 'Photography Circle', description: 'Weekly photo prompts and gear talk.' },
  ];
  for (let i = 0; i < GROUPS.length; i++) {
    const g = GROUPS[i];
    const creator = users[i % users.length];
    const group = await prisma.group.upsert({
      where: { name: g.name },
      update: {},
      create: {
        name: g.name,
        description: g.description,
        coverImageUrl: POST_IMAGES[i % POST_IMAGES.length],
        createdById: creator.id,
      },
    });

    const members = pick(users, 3 + (i % 2));
    for (const m of members) {
      await prisma.groupMember.upsert({
        where: { groupId_userId: { groupId: group.id, userId: m.id } },
        update: {},
        create: { groupId: group.id, userId: m.id, role: m.id === creator.id ? 'OWNER' : 'MEMBER' },
      });
    }

    const existingPosts = await prisma.groupPost.count({ where: { groupId: group.id } });
    if (existingPosts === 0) {
      await prisma.groupPost.create({
        data: {
          groupId: group.id,
          userId: creator.id,
          content: `Welcome to ${g.name}! Introduce yourself and say what brought you here.`,
        },
      });
    }
  }

  console.log('Seeding messages...');
  const conversationPairs: [number, number][] = [
    [0, 1],
    [0, 3],
  ];
  for (const [aIdx, bIdx] of conversationPairs) {
    const a = users[aIdx];
    const b = users[bIdx];
    const exchange = [
      { from: a, to: b, content: 'Hey! Saw your latest post, nice work.' },
      { from: b, to: a, content: 'Thanks! Been heads down on it all week.' },
      { from: a, to: b, content: 'Let me know if you want a second pair of eyes.' },
    ];
    for (let i = 0; i < exchange.length; i++) {
      const m = exchange[i];
      await prisma.message.create({
        data: {
          senderId: m.from.id,
          receiverId: m.to.id,
          content: m.content,
          readAt: i < exchange.length - 1 ? new Date() : null,
          createdAt: new Date(Date.now() - (exchange.length - i) * 1000 * 60 * 20),
        },
      });
    }
  }

  console.log(`Done. Upserted ${users.length} seed users and ${posts.length} posts.`);
  console.log('All seeded users share the password: Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
