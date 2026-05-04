const fs = require('fs'); 
const path = require('path'); 
const walk = dir => { 
  fs.readdirSync(dir).forEach(file => { 
    const p = path.join(dir, file); 
    if (fs.statSync(p).isDirectory()) { 
      if (!p.includes('node_modules') && !p.includes('.nuxt') && !p.includes('.output')) walk(p); 
    } else if (p.endsWith('.vue') || p.endsWith('.js') || p.endsWith('.ts')) { 
      let c = fs.readFileSync(p, 'utf8'); 
      let nc = c.replace(/config\.public\.ADMIN_KEY/g, "'admin'")
                .replace(/config\.public\.DEVELOPER_KEY/g, "'developer'")
                .replace(/'wss:\/\/api\.tierkun\.my\.id\/([^']+)'/g, "\`${config.public.wsBase}/$1\`")
                .replace(/'wss:\/\/api\.tierkun\.my\.id'/g, "\`${config.public.wsBase}\`"); 
      if (c !== nc) { 
        fs.writeFileSync(p, nc); 
        console.log('Updated ' + p); 
      } 
    } 
  }); 
}; 
walk('.');