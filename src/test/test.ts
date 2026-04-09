for (let i = 1; i <= 110; i++) {
    fetch('http://localhost:3000/health')
        .then(res => console.log(`Request ${i}: Status ${res.status}`))
        .catch(err => console.error(err));
}