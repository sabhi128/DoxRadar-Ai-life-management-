const dns = require('dns');

console.log('Resolving Supabase Hostname...');
dns.resolve4('db.ubehzdfkjaouucvpcmso.supabase.co', (err, addresses) => {
    if (err) {
        console.error('IPv4 Error:', err.code);
    } else {
        console.log('IPv4 Addresses:', addresses);
    }
});

dns.resolve6('db.ubehzdfkjaouucvpcmso.supabase.co', (err, addresses) => {
    if (err) {
        console.error('IPv6 Error:', err.code);
    } else {
        console.log('IPv6 Addresses:', addresses);
    }
});
