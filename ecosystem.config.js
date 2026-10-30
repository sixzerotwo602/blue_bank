module.exports = {
  apps: [{
    name: "blue-banker-backend",
    cwd: "./backend",
    script: "./dist/index.js", // tsconfig.json에서 outDir을 ./dist로 설정해야 함
    instances: 1,
    node_args: [],
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      DOTENV_CONFIG_PATH: "/var/lib/blue-app/runtime.env"
    }
  }]
};
