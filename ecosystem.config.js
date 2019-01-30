module.exports = {
  apps : [{
    name: 'cloudvdm',
    script: 'node',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    args: './bin/www',
    instances: 1,
    autorestart: true,
    watch: '../',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      DEBUG: 'cloudvdm*,vdms*,express*,-express:router*'
    },
    env_production: {
      NODE_ENV: 'production',
      DEBUG: 'cloudvdm*,vdms*,express*,-express:router*'
    }
  }],

  deploy : {
    production : {
      user : 'hicharge',
      host : '18.205.93.1',
      ref  : 'origin/production',
      repo : 'git@bitbucket.org:zeroskill/cloud-vdm.git',
      path : '/opt/cloud-vdm',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};