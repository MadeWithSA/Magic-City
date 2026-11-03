// База из 65 товаров Magic City
(function () {
  const categories = ["Суперкары", "Дрифт", "Внедорожники", "Монстр-траки", "Ретро", "Спорт"];
  const badges = ["Хит", "Новинка", "Эксклюзив", "", ""];
  const photos = [
    "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=900&auto=format&fit=crop&q=80"
  ];
  const materials = ["Металл + пластик", "Литой металл", "Металл, резиновые шины"];
  const descs = {
    "Суперкары": "Низкий кузов, точная детализация салона и фар. Выглядит на полке как настоящий гиперкар.",
    "Дрифт": "Лёгкие диски и узкие шины, как у настоящей дрифт-машины. Колёса вращаются свободно.",
    "Внедорожники": "Высокий клиренс, рамная подвеска и открывающиеся двери. Готов к любому бездорожью.",
    "Монстр-траки": "Огромные колёса и усиленная подвеска. Переезжает любые препятствия на столе и на полу.",
    "Ретро": "Копия классики прошлого века: хромированные детали и аккуратная покраска.",
    "Спорт": "Спортивный силуэт, аэродинамический обвес и яркая гоночная ливрея."
  };

  window.PRODUCTS = Array.from({ length: 65 }, (_, i) => {
    const id = i + 1;
    const cat = categories[i % categories.length];
    return {
      id,
      name: `Magic Spec #${id} ${cat.slice(0, -1)}`,
      category: cat,
      scale: i % 2 === 0 ? "1:24" : (i % 3 === 0 ? "1:18" : "1:32"),
      price: 1800 + id * 50,
      rating: (4.4 + (id % 7) * 0.1).toFixed(1),
      badge: badges[i % badges.length],
      image: photos[i % photos.length],
      material: materials[i % materials.length],
      length: 8 + (id % 9) + " см",
      desc: descs[cat]
    };
  });
})();
