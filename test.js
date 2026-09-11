const url = 'https://m.media-amazon.com/images/I/71X1+YnZ-xL._AC_SX679_.jpg';
console.log(url.replace(/\._[A-Za-z0-9_,\-]+\.(jpg|jpeg|png|webp)$/i, '._AC_SL1500_.$1'));
