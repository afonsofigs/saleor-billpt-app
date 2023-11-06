FROM node:18-alpine
RUN apk add --no-cache libc6-compat
# Install dependencies
RUN npm install -g pnpm
RUN pnpm i
# Build app
RUN ls -la
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build
# Run built app
ENV NODE_ENV production
EXPOSE 3003
ENV PORT 3003
ENV DRAFT_INVOICES true
ENV TEMP_PDF_STORAGE_DIR _temp
# Write your token here!
ENV BILL_API_TOKEN <YOUR BILLPT API TOKEN>
CMD ["pnpm", "start", "-p", "3003"]