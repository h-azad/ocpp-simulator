# Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
# Note: The simulator backends (ts files) are run with tsx directly, so no specific build step needed for them other than having the files.
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Install tsx globally (or rely on npx in scripts, which might need internet or cache)
# Better to ensure dependencies are production ready. 
# Since we are using npx tsx, we need to make sure devDependencies (typescript) are available or tsx is installed.
# 'npm ci' installs devDeps by default unless --production is specified.
# In 'deps' stage we did npm ci. In 'runner' we copied node_modules. 
# So node_modules includes devDependencies (like typescript, tsx if it was there - wait, tsx is NOT in package.json, it's run via npx).
# Running 'npx' in production container without internet might fail if it needs to download 'tsx'.
# FIX: Add 'tsx' to package.json or install it globally in the runner.
# Let's install tsx globally in the runner to be safe, or just rely on the fact that we might have internet.
# Actually, best practice is to add `tsx` to package.json.
# For now, I will modify the instruction to install `tsx` globally in the Dockerfile runner stage.

RUN npm install -g tsx

USER nextjs

EXPOSE 3000
EXPOSE 3001
EXPOSE 9220

CMD ["npm", "start"]
