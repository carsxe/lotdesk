#!/bin/sh
set -eu
echo "Waiting for Postgres..."
i=0
until node -e "const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.\$connect().then(()=>p.\$disconnect()).catch((e)=>{console.error(e); process.exit(1)})"; do
  i=$((i+1))
  if [ "$i" -gt 30 ]; then
    echo "Database did not become ready"
    exit 1
  fi
  sleep 2
done
npx prisma migrate deploy
npx prisma db seed
exec npx next start -p "${PORT:-43173}" -H 0.0.0.0
