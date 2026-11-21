import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { getBackendConfig } from './config.ts';

const DATA_DIR = path.resolve(process.cwd(), 'backend', 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'backend', 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'community.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      event_date TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'AWS',
      content TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tech_stack TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      project_url TEXT NOT NULL DEFAULT '',
      architecture_url TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Workshop',
      image_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS community_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      builders_count INTEGER NOT NULL DEFAULT 540,
      events_count INTEGER NOT NULL DEFAULT 42,
      projects_count INTEGER NOT NULL DEFAULT 24,
      workshops_count INTEGER NOT NULL DEFAULT 110,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL DEFAULT 'join',
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      track TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      event_id INTEGER NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function getAppConfig(key: string): string | null {
  const row = db.prepare('SELECT value FROM app_config WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

function setAppConfig(key: string, value: string): void {
  db.prepare(`
    INSERT INTO app_config (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(key, value);
}

function synchronizeAdmin(adminName: string, adminEmail: string, adminPassword: string): void {
  const admin = db
    .prepare("SELECT id, name, email, password_hash FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1")
    .get() as { id: number; name: string; email: string; password_hash: string } | undefined;

  if (!admin) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    try {
      db.prepare(`
        INSERT INTO users (email, name, password_hash, role)
        VALUES (?, ?, ?, 'admin')
      `).run(adminEmail, adminName, passwordHash);

      setAppConfig('admin_email_synced', adminEmail);
      setAppConfig('admin_password_synced_hash', passwordHash);
      return;
    } catch {
      throw new Error('Database update failed while initializing the admin account.');
    }
  }

  if (admin.name !== adminName) {
    try {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(adminName, admin.id);
    } catch {
      throw new Error('Database update failed while synchronizing the configured admin name.');
    }
  }

  const lastSyncedEmail = getAppConfig('admin_email_synced');
  const emailCanBeSynced =
    lastSyncedEmail === null || admin.email.toLowerCase() === lastSyncedEmail.toLowerCase();

  if (emailCanBeSynced && admin.email.toLowerCase() !== adminEmail) {
    try {
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(adminEmail, admin.id);
    } catch {
      throw new Error('Database update failed while synchronizing the configured admin email.');
    }
  }
  setAppConfig('admin_email_synced', emailCanBeSynced ? adminEmail : admin.email);

  const lastSyncedPasswordHash = getAppConfig('admin_password_synced_hash');
  const currentPasswordHash = db
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .get(admin.id) as { password_hash: string };

  if (lastSyncedPasswordHash === null) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    try {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, admin.id);
      setAppConfig('admin_password_synced_hash', passwordHash);
    } catch {
      throw new Error('Database update failed while synchronizing the configured admin password.');
    }
  } else if (bcrypt.compareSync(adminPassword, lastSyncedPasswordHash)) {
    if (currentPasswordHash.password_hash === lastSyncedPasswordHash) {
      // The environment password is unchanged and no Settings password change occurred.
      setAppConfig('admin_password_synced_hash', lastSyncedPasswordHash);
    } else {
      // Preserve a password changed through the existing Settings page.
      setAppConfig('admin_password_synced_hash', currentPasswordHash.password_hash);
    }
  } else if (currentPasswordHash.password_hash === lastSyncedPasswordHash) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    try {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, admin.id);
      setAppConfig('admin_password_synced_hash', passwordHash);
    } catch {
      throw new Error('Database update failed while synchronizing the configured admin password.');
    }
  } else {
    setAppConfig('admin_password_synced_hash', currentPasswordHash.password_hash);
  }
}

function seedInitialData(): void {
  const config = getBackendConfig();
  synchronizeAdmin(config.adminName, config.adminEmail, config.adminPassword);

  // Seed events
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as { count: number };
  if (eventCount.count === 0) {
    const insertEvent = db.prepare(`
      INSERT INTO events (title, slug, description, event_date, location, type, image_url, featured, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvent.run(
      'AWS Cloud Engineering Summit 2026',
      'aws-cloud-engineering-summit-2026',
      'Our flagship full-day engineering conference bringing together 350+ student builders, AWS Heroes, and infrastructure architects. Dive deep into multi-region resilience, serverless event buses, zero-trust VPC design, and live deployment demos built by campus engineering teams.\n\nSchedule highlights:\n- Opening Keynote: Designing Resilient Systems from Zero to Production\n- Deep-Dive Track: AWS Lambda, Rust Runtimes, and Sub-10ms Cold Starts\n- Live Architecture Clinic: Bring your repo and review IAM & CDK stacks with Principal Engineers\n- Evening Builder Showcase: 12 student teams demoing live cloud-native systems.',
      '2026-12-05',
      'Main Engineering Auditorium, Hall A',
      'Summit',
      '/src/assets/images/event_summit_keynote_1794995098221.jpg',
      1,
      1
    );

    insertEvent.run(
      '24-Hour Serverless Cloud Sprint',
      '24-hour-serverless-cloud-sprint',
      'An overnight build sprint where cross-functional teams design, provision, and ship a production-ready event-driven application on AWS using Infrastructure as Code (AWS CDK or Terraform).\n\nEvery team receives sandbox AWS accounts, architecture mentorship throughout the night, and automated CI/CD grading on observability, least-privilege IAM, and resilience under load testing.',
      '2026-12-19',
      'Innovation Foundry Studio, Floor 3',
      'Hackathon',
      '/src/assets/images/event_hackathon_sprint_1794995098854.jpg',
      0,
      1
    );

    insertEvent.run(
      'Hands-On Lab: EventBridge & DynamoDB Single-Table Design',
      'hands-on-lab-eventbridge-dynamodb',
      'Skip slide decks and spend 3 hours writing real AWS CDK TypeScript stacks. We will model complex access patterns in DynamoDB, wire asynchronous domain events through Amazon EventBridge, and instrument distributed tracing with OpenTelemetry.',
      '2027-01-14',
      'Systems Lab 204 & Livestream',
      'Workshop',
      '/src/assets/images/gallery_community_workshop_1794995100654.jpg',
      0,
      1
    );

    insertEvent.run(
      'Spring Kubernetes & EKS Operations Clinic',
      'spring-kubernetes-eks-operations-clinic',
      'Draft curriculum for our upcoming spring workshop series covering Amazon EKS Auto Mode, Karpenter node provisioning, and GitOps rollouts with ArgoCD.',
      '2027-02-08',
      'Cloud Sandbox Room 102',
      'Workshop',
      '/src/assets/images/project_cloud_mesh_1794995098423.jpg',
      0,
      0
    );
  }

  // Seed projects
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    const insertProject = db.prepare(`
      INSERT INTO projects (title, description, tech_stack, image_url, project_url, architecture_url, featured, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProject.run(
      'PulseMesh Telemetry Engine',
      'Real-time distributed trace collector and anomaly detector built by four sophomore builders. Ingests 50k spans/sec over Kinesis Data Streams into Timestream with automated CloudWatch alert routing and sub-second latency dashboards.',
      'AWS Lambda · Kinesis · Rust · DynamoDB · CDK',
      '/src/assets/images/project_cloud_mesh_1794995098423.jpg',
      'https://github.com/stratus-builders/pulsemesh',
      'https://github.com/stratus-builders/pulsemesh/blob/main/ARCHITECTURE.md',
      1,
      1
    );

    insertProject.run(
      'Kestrel IaC Drift Guard',
      'Automated AWS CloudFormation and Terraform drift monitor that runs ephemeral sandbox verification pipelines on every pull request, surfacing IAM permission deltas before deployment.',
      'ECS Fargate · EventBridge · Step Functions · TypeScript',
      '/src/assets/images/project_edge_ops_1794995099867.jpg',
      'https://github.com/stratus-builders/kestrel-drift',
      'https://github.com/stratus-builders/kestrel-drift#architecture',
      0,
      1
    );

    insertProject.run(
      'CampusTransit Live Stream',
      'Low-latency campus shuttle tracking platform handling live GPS telemetry via AWS IoT Core and WebSocket API Gateway, serving 4,200 daily student riders with zero-downtime blue/green releases.',
      'AWS IoT Core · API Gateway · Aurora Serverless · React',
      '/src/assets/images/blog_distributed_systems_1794995100024.jpg',
      'https://github.com/stratus-builders/campus-transit',
      'https://github.com/stratus-builders/campus-transit/wiki/Architecture',
      0,
      1
    );

    insertProject.run(
      'FinOps Sandbox Sweeper',
      'Open-source cost governance daemon that tags ephemeral hackathon AWS accounts and automatically tears down idle NAT gateways, unattached EBS volumes, and orphaned load balancers.',
      'AWS Organizations · Lambda · Python · SQS',
      '/src/assets/images/event_hackathon_sprint_1794995098854.jpg',
      'https://github.com/stratus-builders/finops-sweeper',
      'https://github.com/stratus-builders/finops-sweeper#design',
      0,
      1
    );
  }

  // Seed blog posts
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as { count: number };
  if (postCount.count === 0) {
    const insertPost = db.prepare(`
      INSERT INTO posts (title, slug, excerpt, category, content, image_url, published)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertPost.run(
      'Cutting AWS Lambda Cold Starts by 74% Using Rust & Custom Runtimes',
      'cutting-aws-lambda-cold-starts-with-rust',
      'Benchmarking real-world production endpoints across Node.js, Python, and Rust on ARM64 Graviton2 Lambda functions—and how our student team cut p99 latency under 25ms.',
      'AWS',
      `When our community deployed the CampusTransit WebSocket API during orientation week, morning rush traffic caused sudden burst scaling from 4 concurrent executions to over 600. While warm invocations finished in 8ms, cold-start initialization tails spiked past 950ms on our initial heavyweight runtime bundle.\n\n## Measuring the Bottleneck\n\nUsing AWS X-Ray segment timelines, we isolated three distinct phases during initialization: runtime bootstrap, TLS connection pooling to DynamoDB, and dependency parsing. Over 68% of cold-start time was spent loading unused reflection utilities and SDK clients.\n\n## Migrating Hot Paths to Rust on Graviton2\n\nWe compiled our ingestion handler with cargo-lambda targeting aarch64-unknown-linux-musl. By pairing the AWS SDK for Rust with static connection reuse and stripping debug symbols, our deployment package shrank from 42MB to 3.1MB.\n\n\`\`\`rust\nuse lambda_runtime::{service_fn, Error, LambdaEvent};\nuse serde_json::Value;\n\nasync fn handler(event: LambdaEvent<Value>) -> Result<Value, Error> {\n    // Direct zero-copy telemetry ingest\n    Ok(event.payload)\n}\n\`\`\`\n\n## Measured Results\n\nAcross 100,000 synthetic burst invocations, p99 cold-start duration dropped from 940ms to 24ms—a 74% reduction in tail latency alongside a 38% drop in Lambda GB-second compute spend.\n\nTakeaway for builders: always benchmark your actual critical path with X-Ray before reaching for Provisioned Concurrency.`,
      '/src/assets/images/blog_distributed_systems_1794995100024.jpg',
      1
    );

    insertPost.run(
      'Infrastructure as Code Patterns We Learned Running 40+ Student Workshops',
      'iac-patterns-running-40-student-workshops',
      'How we provision isolated ephemeral AWS sandbox environments with strict SCP guardrails, automated cleanup pipelines, and reusable CDK L3 constructs.',
      'DevOps',
      `Running live cloud workshops for 80 builders in a single room introduces an immediate operational challenge: how do you give every student real root-like freedom to deploy VPCs, ECS clusters, and Lambda functions without waking up to a runaway cloud bill?\n\n## Ephemeral Account Vending\n\nRather than sharing a single cluttered IAM account, we built an automated vending workflow backed by AWS Organizations. Before each workshop, a dedicated OU spins up isolated sandbox accounts scoped with Service Control Policies (SCPs) that allow core compute and serverless services while blocking expensive multi-GPU instance families.\n\n## Composable CDK Constructs\n\nEvery workshop repository ships with a verified starter CDK stack containing pre-wired VPC endpoints and OpenTelemetry collectors so attendees spend their evening engineering application logic instead of debugging route tables.\n\nOnce the event wraps, our FinOps Sweeper triggers via EventBridge and gracefully decommissions resources within 15 minutes.`,
      '/src/assets/images/project_edge_ops_1794995099867.jpg',
      1
    );

    insertPost.run(
      'Designing Zero-Trust Service Mesh Topologies on Amazon ECS',
      'zero-trust-service-mesh-amazon-ecs',
      'A practical walkthrough of mTLS identity, ECS Service Connect, and least-privilege task roles for student engineering teams graduating from monoliths.',
      'Cloud',
      `Most campus projects start as a single Express or FastAPI server connected to a database. Once teams split billing, notifications, and telemetry into independent microservices, flat security groups quickly become hard to audit.\n\n## Moving Beyond Network-Only Trust\n\nWith Amazon ECS Service Connect and AWS App Mesh, service-to-service communication gets automatic mutual TLS encryption and deterministic service discovery without managing custom Envoy control planes by hand.\n\nPair each ECS Task Definition with a dedicated Task IAM Role scoped strictly to the exact DynamoDB table ARN or SQS queue URL it owns. Security becomes a built-in architecture invariant rather than an afterthought.`,
      '/src/assets/images/project_cloud_mesh_1794995098423.jpg',
      1
    );

    insertPost.run(
      'Draft: Building Multi-Agent Cloud Runbooks with Amazon Bedrock',
      'multi-agent-cloud-runbooks-bedrock',
      'Work-in-progress engineering notes exploring deterministic incident triage pipelines using Bedrock Agents and Step Functions.',
      'AI',
      `Draft notes for upcoming community deep dive on automated incident summarization and guardrails.`,
      '/src/assets/images/event_summit_keynote_1794995098221.jpg',
      0
    );
  }

  // Seed gallery
  const galleryCount = db.prepare('SELECT COUNT(*) as count FROM gallery').get() as { count: number };
  if (galleryCount.count === 0) {
    const insertGallery = db.prepare(`
      INSERT INTO gallery (title, category, image_url) VALUES (?, ?, ?)
    `);

    insertGallery.run(
      'Cloud Engineering Summit Opening Keynote',
      'Summit',
      '/src/assets/images/event_summit_keynote_1794995098221.jpg'
    );
    insertGallery.run(
      'Night Serverless Hackathon Sprint — Team Sync',
      'Hackathon',
      '/src/assets/images/event_hackathon_sprint_1794995098854.jpg'
    );
    insertGallery.run(
      'Whiteboard Architecture Session: EventBridge & DynamoDB',
      'Workshop',
      '/src/assets/images/gallery_community_workshop_1794995100654.jpg'
    );
    insertGallery.run(
      'PulseMesh Hardware & Optical Telemetry Rig',
      'Projects',
      '/src/assets/images/project_cloud_mesh_1794995098423.jpg'
    );
    insertGallery.run(
      'Infrastructure Topology Lab Workstation',
      'Cloud Labs',
      '/src/assets/images/project_edge_ops_1794995099867.jpg'
    );
    insertGallery.run(
      'Cold-Aisle Infrastructure Tour & Ops Briefing',
      'Meetup',
      '/src/assets/images/blog_distributed_systems_1794995100024.jpg'
    );
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
