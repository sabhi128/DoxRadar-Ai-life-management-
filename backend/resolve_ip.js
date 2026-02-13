const dns = require('dns');

console.log('Resolving Supabase Hostname...');
dns.resolve4('db.ubehzdfkjaouucvpcmso.supabase.co', (err, addresses) => {
    if (err) {
        console.error('DNS Error:', err);
    } else {
        console.log('Supabase IPv4:', addresses[0]);
    }
});
