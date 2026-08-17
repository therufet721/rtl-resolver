if (!process.env.RTL_RELEASE) {
  console.error("Use npm run verify:release && npm run release:publish");
  process.exit(1);
}
