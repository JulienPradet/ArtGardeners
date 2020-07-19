# Migration `20200628161343-init`

This migration has been generated at 6/28/2020, 4:13:43 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TABLE "public"."ArtProject" (
"id" text  NOT NULL ,"name" text  NOT NULL ,"slug" text  NOT NULL ,
    PRIMARY KEY ("id"))

CREATE TABLE "public"."User" (
"email" text  NOT NULL ,"id" text  NOT NULL ,"passwordHash" text  NOT NULL ,
    PRIMARY KEY ("id"))

CREATE UNIQUE INDEX "ArtProject.slug" ON "public"."ArtProject"("slug")

CREATE UNIQUE INDEX "User.email" ON "public"."User"("email")
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration ..20200628161343-init
--- datamodel.dml
+++ datamodel.dml
@@ -1,0 +1,23 @@
+// This is your Prisma schema file,
+// learn more about it in the docs: https://pris.ly/d/prisma-schema
+
+datasource db {
+  provider = "postgresql"
+  url = "***"
+}
+
+generator client {
+  provider = "prisma-client-js"
+}
+
+model ArtProject {
+  id   String @id @default(uuid())
+  slug String @unique
+  name String
+}
+
+model User {
+  id           String @id @default(uuid())
+  email        String @unique
+  passwordHash String
+}
```


