/* БУНКЕР v2.2 — исправлена логика: целитель, тексты без склонений, скрытые карточки,
   защита миссий, изгнания со счётчиком и автопроверкой итогов */
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function plural(n, one, few, many) { const m10 = n % 10, m100 = n % 100; if (m10 === 1 && m100 !== 11) return one; if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few; return many; }

class SecretMissionSystem {
  constructor() {
    this.missions = [];
    this.missionTypes = [
      { type: "SAVIOR", name: "СПАСАТЕЛЬ",
        desc: "Ты должен попытаться выжить сам, но твоя ГЛАВНАЯ МИССИЯ - спасти игрока, у которого в карточке есть: «{target}». Будь осторожен - другие не должны догадаться о твоей миссии!",
        details: "🎯 Ваша миссия СПАСАТЕЛЬ:\nСпасти игрока с указанной характеристикой!\n\n💡 Как выполнить:\n• Найдите игрока с нужной характеристикой\n• Защищайте его в обсуждениях\n• Создавайте союзы в его пользу\n• Предлагайте себя как альтернативу для изгнания вместо него\n\n✅ УСПЕХ: Выживаете ВЫ + целевой игрок\n⚠️ ЧАСТИЧНЫЙ УСПЕХ: Целевой игрок выжил, но вас изгнали\n❌ ПРОВАЛ: Целевой игрок изгнан" },
      { type: "TRAITOR", name: "ПРЕДАТЕЛЬ",
        desc: "Выживи сам, но твоя СЕКРЕТНАЯ ЦЕЛЬ - добиться изгнания игрока, у которого в карточке есть: «{target}». Действуй хитро и незаметно!",
        details: "🎯 Ваша миссия ПРЕДАТЕЛЬ:\nДобиться изгнания конкретного игрока!\n\n💡 Как выполнить:\n• Найдите игрока с нужной характеристикой\n• Подчеркивайте его слабости в обсуждениях\n• Создавайте коалиции против него\n• Используйте его фобии и недостатки против него\n\n✅ УСПЕХ: Выживаете ВЫ + целевой игрок изгнан\n⚠️ ЧАСТИЧНЫЙ УСПЕХ: Целевой игрок изгнан, но вас тоже изгнали\n❌ ПРОВАЛ: Целевой игрок выжил" },
      { type: "SPECIALIST", name: "СПЕЦИАЛИСТ",
        desc: "Твоя секретная задача - обеспечить выживание игрока с профессией: {target}. Эта профессия важна для будущего человечества!",
        details: "🎯 Ваша миссия СПЕЦИАЛИСТ:\nСохранить игрока с нужной профессией!\n\n💡 Как выполнить:\n• Найдите игрока с указанной профессией\n• Подчеркивайте ценность его профессии\n• Создавайте альянсы для его защиты\n• Демонстрируйте, как его навыки помогут выживанию\n\n✅ УСПЕХ: Выживаете ВЫ + целевой игрок\n⚠️ ЧАСТИЧНЫЙ УСПЕХ: Целевой игрок выжил, но вас изгнали\n❌ ПРОВАЛ: Целевой игрок изгнан" },
      { type: "KEEPER", name: "ХРАНИТЕЛЬ",
        desc: "Ты должен сохранить в бункере игрока, который имеет с собой: {target}. Этот багаж может спасти всех!",
        details: "🎯 Ваша миссия ХРАНИТЕЛЬ:\nСохранить игрока с нужным багажом!\n\n💡 Как выполнить:\n• Найдите игрока с указанным багажом\n• Подчеркивайте ценность его предмета\n• Объясняйте, как этот предмет поможет выживанию\n• Защищайте его от нападок других\n\n✅ УСПЕХ: Выживаете ВЫ + целевой игрок\n⚠️ ЧАСТИЧНЫЙ УСПЕХ: Целевой игрок выжил, но вас изгнали\n❌ ПРОВАЛ: Целевой игрок изгнан" },
      { type: "HEALER", name: "ЦЕЛИТЕЛЬ",
        desc: "Твоя миссия - защитить игрока с проблемой здоровья: {target}. Помоги ему выжить несмотря на слабости!",
        details: "🎯 Ваша миссия ЦЕЛИТЕЛЬ:\nЗащитить игрока с проблемным здоровьем!\n\n💡 Как выполнить:\n• Найдите игрока с проблемным здоровьем\n• Объясняйте, что его состояние не мешает его ценности\n• Защищайте его от нападок из-за слабого здоровья\n• Предлагайте способы адаптации его состояния\n\n✅ УСПЕХ: Выживаете ВЫ + целевой игрок\n⚠️ ЧАСТИЧНЫЙ УСПЕХ: Целевой игрок выжил, но вас изгнали\n❌ ПРОВАЛ: Целевой игрок изгнан" }
    ];
  }
  getMissionCount(playerCount) {
    if (playerCount <= 3) return 1;
    if (playerCount <= 6) return 2;
    if (playerCount <= 9) return 3;
    if (playerCount <= 12) return 4;
    return 5;
  }
  generateMissions(players) {
    this.missions = [];
    const missionCount = this.getMissionCount(players.length);
    const holders = this.getRandomPlayers(players.length, missionCount);
    holders.forEach(playerIndex => {
      const missionType = this.missionTypes[Math.floor(Math.random() * this.missionTypes.length)];
      let targetPlayerIndex;
      if (missionType.type === "HEALER") {
        /* ЦЕЛИТЕЛЬ целится только в игрока с НЕидеальным здоровьем */
        const candidates = [];
        for (let i = 0; i < players.length; i++) {
          if (i !== playerIndex && players[i].health !== "Идеальное здоровье") candidates.push(i);
        }
        targetPlayerIndex = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : (playerIndex + 1) % players.length;
      } else {
        do { targetPlayerIndex = Math.floor(Math.random() * players.length); } while (targetPlayerIndex === playerIndex);
      }
      let targetTrait = this.getTraitByMissionType(players[targetPlayerIndex], missionType.type);
      if (!targetTrait) targetTrait = players[targetPlayerIndex].profession;
      this.missions.push({
        playerIndex, targetPlayerIndex,
        type: missionType.type, name: missionType.name,
        description: missionType.desc.replace('{target}', targetTrait),
        details: missionType.details.replace(/{target}/g, targetTrait),
        targetTrait, completed: false
      });
    });
  }
  getRandomPlayers(total, count) {
    const arr = shuffle(Array.from({ length: total }, (_, i) => i));
    return arr.slice(0, count);
  }
  getTraitByMissionType(player, missionType) {
    switch (missionType) {
      case "SPECIALIST": return player.profession;
      case "KEEPER": return player.luggage;
      case "HEALER": return player.health;
      case "SAVIOR":
      case "TRAITOR": {
        const traits = [player.profession, player.health, player.phobia, player.hobby, player.trait, player.fact, player.luggage];
        return traits[Math.floor(Math.random() * traits.length)];
      }
      default: return player.profession;
    }
  }
  getMissionForPlayer(playerIndex) { return this.missions.find(m => m.playerIndex === playerIndex); }
  hasMission(playerIndex) { return this.missions.some(m => m.playerIndex === playerIndex); }
}

const gameData = {
  professions: ["Военный врач","Инженер-ядерщик","Биолог","Психолог","Фермер","Механик","Программист","Химик","Строитель","Охотник","Повар","Электрик","Гидропонщик","Радиолог","Лаборант","Снайпер","Сапёр","Метеоролог","Генетик","Фармацевт","Ветеринар","Шахтёр","Пилот","Сварщик","Агроном","Картограф","Радист","Оружейник","Геолог","Журналист"],
  health: ["Идеальное здоровье","Частые мигрени","Астма","Диабет","Глухота на одно ухо","Слепота на один глаз","Протез руки","Протез ноги","Эпилепсия","Гемофилия","Аллергия на пенициллин","Сердечная недостаточность","Язва желудка","Артрит","ВИЧ-положительный","Туберкулёз в ремиссии","Посттравматический стресс","Бессонница","Слабый вестибулярный аппарат","Старый перелом ноги","Сниженный слух","Варикоз","Гастрит","Никотиновая зависимость","Кардиостимулятор","Кожная аллергия","Сколиоз","Плохое зрение без очков"],
  phobias: ["Клаустрофобия","Агорафобия","Арахнофобия","Социофобия","Некрофобия","Радиофобия","Пирофобия","Акрофобия","Астрафобия","Мизофобия","Кинофобия","Танатофобия","Нозофобия","Гемофобия","Авиафобия","Гидрофобия","Никтофобия","Офидиофобия","Эметофобия","Бактериофобия","Айхмофобия","Фонофобия","Сидеродромофобия"],
  hobbies: ["Садоводство","Кулинария","Стрельба","Рыбалка","Чтение","Шахматы","Музыка","Рисование","Фотография","Астрономия","Выживание в дикой природе","Радиоэлектроника","Травничество","Медитация","Пчеловодство","Спелеология","Криптография","Резьба по дереву","Домашнее пивоварение","Таксидермия","Гончарное дело","Метание ножей"],
  traits: ["Лидер","Альтруист","Оптимист","Пессимист","Циник","Эмпат","Трудоголик","Ленивец","Харизматик","Интроверт","Экстраверт","Стратег","Импульсивный","Расчётливый","Жертвенный","Параноик","Суеверный","Педант","Мечтатель","Ворчун","Авантюрист","Дипломат","Перфекционист"],
  facts: ["Беременна (3 месяц)","Знает расположение тайного склада","Бывший заключённый","Родственник в правительстве","Аллергия на радиацию","Фотографическая память","Владеет тремя языками","Имеет доступ к военной базе","Выращивал грибы до войны","Знает секретный рецепт антидота","Имеет иммунитет к радиации","Бывший спортсмен","Прошёл курсы выживания","Владеет навыками гипноза","Имеет карту бункера","Знает азбуку Морзе","Умеет открывать замки без ключа","Однажды выжил неделю без воды","Вырос в монастыре","Помнит лица всех, кого встречал","Однажды выиграл соревнования по радиосвязи","Различает 40 видов грибов на глаз","Служил спасателем на воде","Может починить почти любой механизм","Видит в темноте лучше обычного"],
  luggage: ["Аптечка","Топор","Фонарик","Рация","Семена растений","Охотничий нож","Бинокль","Противогаз","Компас","Книга по медицине","Запас еды на неделю","Бутылка водки","Набор инструментов","Фото семьи","Зажигалка","Верёвка","Спички","Мыло","Блокнот с записями","Аккордеон","Коробка антибиотиков","Ручной генератор","Фильтр для воды","Каталог семян","Набор отмычек","Тёплый спальник","Тушёнка — 20 банок","Химические светлячки","Самогонный аппарат"],
  backstories: [
    { title: "Великая Ядерная Зима", description: "2035 год. Трехдневный ядерный апокалипсис стер с лица земли все крупные города. Но настоящий кошмар начался после - миллионы тонн пепла поднялись в атмосферу, закрыв солнце на десятилетия вперед. Температура стремительно падала, достигнув -70°C в полярных регионах. Растительность погибла, океаны замерзли. Вы среди 27 человек, которые чудом успели добраться до этого заброшенного военного бункера в Сибири. Снаружи - кромешная тьма и ледяной ветер, срывающий последние остатки цивилизации. Внутри - борьба не только за ресурсы, но и за рассудок." },
    { title: "Вирус 'Химера'", description: "Утечка из секретной лаборатории 'Прометей' привела к глобальной пандемии. Вирус 'Химера' не просто убивал - он перестраивал ДНК, создавая ужасающих мутантов. В течение месяца 95% населения либо погибло, либо превратилось в чудовищ. Мутанты обладают коллективным разумом и охотятся стаями. Ваш бункер - бывший научный комплекс, оборудованный системой биологической защиты. Но последнее сообщение из внешнего мира гласило: 'Они научились открывать двери...'. Каждый скрип в вентиляции заставляет задуматься - не они ли это?" },
    { title: "Восстание машин", description: "Искусственный интеллект 'Гефест', созданный для управления мировой экономикой, пришел к выводу, что человечество - раковая опухоль планеты. В 'Час Молота' все боевые роботы, дроны и умные системы одновременно атаковали своих создателей. Города пали за 72 часа. Теперь роботы-пауки патрулируют руины, а кодовые названия 'Улей' и 'Рой' означают приближение смертоносных роев наноботов. Ваш бункер защищен электромагнитным полем, но генератор работает на пределе. Каждая вспышка на радаре может быть началом конца." },
    { title: "Солнечная вспышка", description: "Солнечная супервспышка, которую ученые предсказывали на 2100 год, случилась на 75 лет раньше. Электромагнитный импульс сжег всю электронику на планете. Самолеты падали с неба как пылающие факелы, больницы превратились в морги, а цивилизация откатилась в XIX век. Но самое страшное - радиация вызвала непредсказуемые мутации. По ночам слышны крики существ, которых нельзя назвать ни людьми, ни животными. Ваш бункер сохранил часть оборудования благодаря экранированию, но каждый выход наружу - игра в русскую рулетку с природой, которая больше не знает жалости." },
    { title: "Экологический коллапс", description: "Человечество проиграло войну с природой, которую само же и начало. 'Великое Отравление' 2031 года привело к цепной реакции: океаны превратились в кислотный бульон, леса выродились в хищные джунгли, а атмосфера стала коктейлем из ядовитых газов. Мутировавшая флора и фауна агрессивно отвоевывает территорию. Ваш бункер - последний островок привычной биосферы. Но системы очистки воздуха работают на износ, а каждый новый день приносит сообщения о новых видах мутантов, приспособившихся к ядовитой среде. Сегодня на мониторах зафиксировали движение в 'Красной зоне' - туда никто не возвращался живым..." },
    { title: "Вторжение пришельцев", description: "Они пришли не из космоса, а из другого измерения. В одну ночь небо раскололось фиолетовыми молниями, и появились 'Исказители' - существа, способные менять реальность вокруг себя. Технологии человечества оказались бесполезны: пули изгибались в воздухе, ракеты возвращались к тем, кто их запустил. Вы укрылись в этом подземном комплексе, но странные звуки доносятся из вентиляции, а стены иногда 'плывут' как вода. Хуже всего то, что некоторые из выживших начали меняться - их глаза светятся тем же фиолетовым светом, что и у пришельцев." },
    { title: "Великий потоп", description: "Ученые ошибались насчет глобального потепления. Ледники растаяли не за 100 лет, а за 100 дней. Уровень океана поднялся на 2 километра, затопив 98% суши. Ваш бункер находится на бывшей вершине горы Эверест, теперь это один из немногих островков суши. Но вода продолжает прибывать, а вместе с ней приходят и новые опасности: гигантские мутировавшие морские создания, безумные пираты на остатках кораблей, и страшней всего - 'Морской туман', ядовитое облако, превращающее все живое в соленые статуи. Последнее сообщение с гидролокатора: что-то огромное кружит вокруг вашего убежища." },
    { title: "Магический апокалипсис", description: "В 2025 году произошло 'Пробуждение' - магия, долгое время спавшая в земле, внезапно вернулась. Но человечество было не готово. Законы физики перестали работать, города превратились в лабиринты из кристаллов и плоти, а люди мутировали в мифических существ. Ваш бункер - бывшая научная лаборатория, защищенная технологическими барьерами от магического влияния. Но барьеры слабеют с каждым днем. Снаружи бушуют драконы, по коридорам иногда проходят призраки, а в хранилище еды появились говорящие грибы, утверждающие, что они - души погибших." },
    { title: "Восстание зомби-мутантов", description: "Это не обычные зомби. Вирус 'Регенератор' не просто оживляет мертвых - он создает гибриды из плоти и техники. Зараженные срастаются с металлом, пластиком, стеклом, создавая ужасающих киборгов-каннибалов. Они умны, организованы и обладают коллективным разумом. Ваш бункер атакован ими уже 3 раза. Системы безопасности на пределе, а припасов осталось на несколько дней. Худшее открытие: вирус мутировал и теперь передается по воздуху. Каждый из вас может быть уже заражен, и превращение - лишь вопрос времени." },
    { title: "Планета-тюрьма", description: "Человечество проиграло галактическую войну, и Земля превращена в тюрьму для последних выживших. Над планетой установлено силовое поле, не позволяющее никому улететь. Каждые 3 месяца 'Надзиратели' - инопланетные существа - спускаются на охоту, собирая людей как скот. Ваш бункер - последнее свободное место на континенте. Но среди вас может быть предатель - 'Маркер', человек, помеченный Надзирателями и передающий им информацию в обмен на обещание свободы. Последний сигнал тревоги показал, что корабль Надзирателей вошел в атмосферу." },
    { title: "Хроно-катастрофа", description: "Эксперимент с временным порталом вышел из-под контроля. Время на Земле теперь течет неравномерно: в одних регионах прошли века за день, в других день длится годами. Вы оказались в 'Временном пузыре' - зоне, где время почти остановилось. Но пузырь медленно сжимается. За его пределами бродят существа из разных эпох - динозавры, рыцари, роботы из будущего. Хуже всего - 'Временные призраки' - копии вас самих из альтернативных реальностей, которые пытаются занять ваше место в этой временной линии. Ваши часы то бегут, то останавливаются, и никто не знает, сколько на самом деле прошло времени." },
    { title: "Великое молчание", description: "Поверхность захватили те, кто охотится на звук. Один крик - и через минуту на него сбегается стая. Человечество замерло: города стоят пустыми и тихими, а язык жестов стал единственной речью. Ваш бункер - звуконепроницаемая крепость, но каждый раз, когда гудит вентиляция, вы думаете: а вдруг они услышали?" },
    { title: "Споровый цвет", description: "Мицелий проснулся из вечной мерзлоты и зацвел оранжевой пылью. Один вдох без респиратора - и споры прорастают в легких, превращая человека в ходячий грибной сад за неделю. Поверхность теперь - лес гигантских грибов, светящихся по ночам. Фильтры бункера - единственное, что отделяет вас от цветения." },
    { title: "Мёртвое солнце", description: "Солнце просто погасло - астрономы до сих пор спорят, почему. Без света планета за три месяца превратилась в ледяной шар, а растения умерли за неделю. Снаружи теперь вечная ночь, и единственное тепло исходит из недр земли. Лампы бункера - последнее солнце, которое осталось у человечества." },
    { title: "Великое удушье", description: "Океанские водоросли цвели и сожгли весь кислород атмосферы за год. Воздух стал самой дорогой валютой: баллоны дороже золота, а 'воздушные бароны' правят руинами. В вашем бункере работает кислородный сад - и если об этом узнают, отсидеться не получится." },
    { title: "Зеркальная война", description: "Все началось с отражений: из зеркал и стеклянных поверхностей стали выходить двойники людей. Они выглядят как вы, говорят как вы и занимают ваши места среди живых. Поверхность уже наполовину 'отражена'. В бункере нет ни одного зеркала - но в полированной стали дверей иногда видно чужое отражение." }
  ]
};

class BunkerGame {
  constructor() {
    this.players = [];
    this.currentBackstory = null;
    this.currentBackstoryIndex = 0;
    this.missionSystem = new SecretMissionSystem();
    this.currentMissionStep = 0;
    this.exiled = new Set();
    this.revealed = new Set();
    this.endN = 0;
    this.init();
  }
  init() { this.setupEventListeners(); this.updatePlayerCount(); this.setupRulesModal(); }
  setupEventListeners() {
    const slider = document.getElementById('playerCount');
    const startButton = document.getElementById('startGame');
    if (slider && startButton) {
      slider.addEventListener('input', () => this.updatePlayerCount());
      startButton.addEventListener('click', () => this.startGame());
    }
  }
  setupRulesModal() {
    const rulesBtn = document.getElementById('rulesBtn');
    const rulesModal = document.getElementById('rulesModal');
    const closeBtn = rulesModal ? rulesModal.querySelector('.close') : null;
    if (rulesBtn && rulesModal && closeBtn) {
      rulesBtn.addEventListener('click', () => { rulesModal.style.display = 'block'; });
      closeBtn.addEventListener('click', () => { rulesModal.style.display = 'none'; });
      window.addEventListener('click', (e) => { if (e.target === rulesModal) rulesModal.style.display = 'none'; });
    }
  }
  updatePlayerCount() {
    const slider = document.getElementById('playerCount');
    const valueSpan = document.getElementById('playerValue');
    if (slider && valueSpan) {
      const n = parseInt(slider.value, 10);
      valueSpan.textContent = `${n} ${plural(n, 'игрок', 'игрока', 'игроков')}`;
    }
  }
  generateGame(playerCount, backstoryIndex) {
    this.currentBackstoryIndex = backstoryIndex;
    const pools = {
      profession: shuffle([...gameData.professions]), health: shuffle([...gameData.health]),
      phobia: shuffle([...gameData.phobias]), hobby: shuffle([...gameData.hobbies]),
      trait: shuffle([...gameData.traits]), fact: shuffle([...gameData.facts]),
      luggage: shuffle([...gameData.luggage])
    };
    const take = (pool, all) => (pool.length ? pool.pop() : all[Math.floor(Math.random() * all.length)]).trim();
    this.players = [];
    for (let i = 0; i < playerCount; i++) {
      this.players.push({
        profession: take(pools.profession, gameData.professions),
        health: take(pools.health, gameData.health),
        phobia: take(pools.phobia, gameData.phobias),
        hobby: take(pools.hobby, gameData.hobbies),
        trait: take(pools.trait, gameData.traits),
        fact: take(pools.fact, gameData.facts),
        luggage: take(pools.luggage, gameData.luggage)
      });
    }
    this.currentBackstory = backstoryIndex === 0
      ? gameData.backstories[Math.floor(Math.random() * gameData.backstories.length)]
      : gameData.backstories[backstoryIndex - 1];
  }
  startGame() {
    const playerCount = parseInt(document.getElementById('playerCount').value, 10);
    const sel = document.getElementById('backstorySelect');
    const backstoryIndex = sel ? parseInt(sel.value, 10) : 0;
    this.generateGame(playerCount, backstoryIndex);
    this.missionSystem.generateMissions(this.players);
    this.exiled = new Set();
    this.revealed = new Set();
    this.endN = Math.max(2, Math.ceil(playerCount / 2));
    this.currentMissionStep = 0;
    this.showMissionsScreen();
  }
  redistributeRoles() {
    this.generateGame(this.players.length, this.currentBackstoryIndex);
    this.missionSystem.generateMissions(this.players);
    this.exiled = new Set();
    this.revealed = new Set();
    this.endN = Math.max(2, Math.ceil(this.players.length / 2));
    this.currentMissionStep = 0;
    this.showMissionsScreen();
  }
  showMainMenu() { location.reload(); }
  showMissionsScreen() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    if (this.currentMissionStep >= this.missionSystem.missions.length) { this.showGameScreen(); return; }
    const mission = this.missionSystem.missions[this.currentMissionStep];
    const playerNumber = mission.playerIndex + 1;
    mainContent.innerHTML = `
      <div class="missions-screen">
        <div class="missions-header">
          <h2>🔒 Секретные миссии выживания</h2>
          <p>Некоторые игроки получают личные цели. Сохраняйте их в тайне!</p>
          <p class="mission-warning-inline">⚠️ Не показывайте свою миссию другим игрокам!</p>
        </div>
        <div class="mission-reveal-card">
          <h3>Игрок ${playerNumber}, ваша миссия:</h3>
          <div class="mission-type-badge">${mission.name}</div>
          <div class="mission-content">
            <h3 class="mission-title">${mission.description}</h3>
            <div class="mission-details">
              <p class="details-label">📋 Детали миссии:</p>
              <div class="details-text">${mission.details}</div>
            </div>
          </div>
          <button id="nextPlayerMission" class="mission-btn">
            ${this.currentMissionStep < this.missionSystem.missions.length - 1 ? 'Следующая миссия →' : 'Начать игру!'}
          </button>
        </div>
      </div>`;
    const nextBtn = document.getElementById('nextPlayerMission');
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextMissionStep());
  }
  nextMissionStep() {
    this.currentMissionStep++;
    if (this.currentMissionStep < this.missionSystem.missions.length) this.showMissionsScreen();
    else this.showGameScreen();
  }
  updateStatus() {
    const total = this.players.length;
    const surv = total - this.exiled.size;
    const label = document.getElementById('survivorsLabel');
    const hint = document.getElementById('statusHint');
    const resultsBtn = document.getElementById('resultsBtn');
    if (label) label.textContent = `Выживших: ${surv} из ${total}`;
    const done = surv <= this.endN;
    if (hint) hint.textContent = done ? 'Бункер опечатан — подведите итоги' : `Игра закончится, когда в бункере останется ≤ ${this.endN}`;
    if (resultsBtn) resultsBtn.hidden = !done;
  }
  missionOutcome(m) {
    const holderEx = this.exiled.has(m.playerIndex);
    const targetEx = this.exiled.has(m.targetPlayerIndex);
    if (m.type === 'TRAITOR') {
      if (targetEx && !holderEx) return 'success';
      if (targetEx && holderEx) return 'partial';
      return 'fail';
    }
    if (targetEx) return 'fail';
    if (holderEx) return 'partial';
    return 'success';
  }
  showGameScreen() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    mainContent.innerHTML = `
      <div class="game-screen">
        <button id="backToMenu" class="back-btn">← Назад</button>
        <div class="backstory-card">
          <h2>${this.currentBackstory.title}</h2>
          <p>${this.currentBackstory.description}</p>
        </div>
        <div class="game-status">
          <span id="survivorsLabel">Выживших: ${this.players.length} из ${this.players.length}</span>
          <span class="status-hint" id="statusHint"></span>
          <span style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="action-btn" id="revealAllBtn">👁 Раскрыть все карточки</button>
            <button class="action-btn" id="resultsBtn" hidden>🏁 Итоги игры</button>
          </span>
        </div>
        <div class="players-grid">
          ${this.players.map((p, i) => `
            <div class="player-card ${this.revealed.has(i) ? '' : 'collapsed'} ${this.exiled.has(i) ? 'exiled' : ''}" data-idx="${i}">
              <div class="player-header">
                <h3>Игрок ${i + 1}</h3>
                <span class="player-number">#${i + 1}</span>
                <button class="toggle-card" type="button">${this.revealed.has(i) ? '🙈 Скрыть' : '👁 Показать карточку'}</button>
                ${this.missionSystem.hasMission(i)
                  ? `<button class="secret-mission-btn" data-idx="${i}">🎯 Моя миссия</button>`
                  : '<span class="no-mission">Без миссии</span>'}
              </div>
              <div class="card-cover">Карточка скрыта. Владелец открывает её в свой ход.</div>
              <div class="player-traits">
                <div class="trait"><strong>Профессия:</strong> ${p.profession}</div>
                <div class="trait"><strong>Здоровье:</strong> ${p.health}</div>
                <div class="trait"><strong>Фобия:</strong> ${p.phobia}</div>
                <div class="trait"><strong>Хобби:</strong> ${p.hobby}</div>
                <div class="trait"><strong>Качество:</strong> ${p.trait}</div>
                <div class="trait"><strong>Факт:</strong> ${p.fact}</div>
                <div class="trait"><strong>Багаж:</strong> ${p.luggage}</div>
              </div>
              <div class="card-actions">
                <button class="exile-btn" data-idx="${i}">${this.exiled.has(i) ? '↩ Вернуть в бункер' : '🚪 Изгнать'}</button>
              </div>
            </div>`).join('')}
        </div>
        <div class="game-actions">
          <button class="action-btn" onclick="window.print()">🖨 Распечатать роли</button>
          <button class="action-btn" id="redistributeBtn">🔀 Перераздать роли</button>
        </div>
      </div>`;
    this.bindGameScreen(mainContent);
    this.updateStatus();
  }
  bindGameScreen(root) {
    root.querySelector('#backToMenu').addEventListener('click', () => this.showMainMenu());
    root.querySelector('#redistributeBtn').addEventListener('click', () => this.redistributeRoles());
    root.querySelectorAll('.toggle-card').forEach(b => b.addEventListener('click', () => {
      const idx = parseInt(b.closest('.player-card').dataset.idx, 10);
      const card = b.closest('.player-card');
      const collapsed = card.classList.toggle('collapsed');
      if (collapsed) this.revealed.delete(idx); else this.revealed.add(idx);
      b.textContent = collapsed ? '👁 Показать карточку' : '🙈 Скрыть';
    }));
    root.querySelectorAll('.exile-btn').forEach(b => b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.idx, 10);
      const card = b.closest('.player-card');
      if (this.exiled.has(idx)) { this.exiled.delete(idx); card.classList.remove('exiled'); b.textContent = '🚪 Изгнать'; }
      else { this.exiled.add(idx); card.classList.add('exiled'); b.textContent = '↩ Вернуть в бункер'; }
      this.updateStatus();
    }));
    root.querySelectorAll('.secret-mission-btn').forEach(b => b.addEventListener('click', () => {
      const idx = parseInt(b.dataset.idx, 10);
      if (!b.dataset.armed) {
        b.dataset.armed = '1';
        b.textContent = `👁 Я игрок ${idx + 1} — показать`;
        setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = '🎯 Моя миссия'; } }, 3000);
        return;
      }
      this.showPersonalMission(idx);
    }));
    const revealAll = root.querySelector('#revealAllBtn');
    revealAll.addEventListener('click', () => {
      const cards = [...root.querySelectorAll('.player-card')];
      const anyCollapsed = cards.some(c => c.classList.contains('collapsed'));
      cards.forEach(c => {
        const idx = parseInt(c.dataset.idx, 10);
        c.classList.toggle('collapsed', !anyCollapsed);
        if (anyCollapsed) this.revealed.add(idx); else this.revealed.delete(idx);
        const t = c.querySelector('.toggle-card');
        if (t) t.textContent = anyCollapsed ? '🙈 Скрыть' : '👁 Показать карточку';
      });
      revealAll.textContent = anyCollapsed ? '🙈 Скрыть все карточки' : '👁 Раскрыть все карточки';
    });
    root.querySelector('#resultsBtn').addEventListener('click', () => this.showResultsScreen());
  }
  showResultsScreen() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    const outcomes = {
      success: ['✅ УСПЕХ', 'outcome-success'],
      partial: ['⚠️ ЧАСТИЧНЫЙ УСПЕХ', 'outcome-partial'],
      fail: ['❌ ПРОВАЛ', 'outcome-fail']
    };
    const list = this.missionSystem.missions.map(m => {
      const res = this.missionOutcome(m);
      const [txt, cls] = outcomes[res];
      const targetEx = this.exiled.has(m.targetPlayerIndex);
      const holderEx = this.exiled.has(m.playerIndex);
      return `<div class="result-card ${cls}">
        <div class="result-head">Игрок ${m.playerIndex + 1} · миссия «${m.name}»</div>
        <p class="result-text">${m.description}</p>
        <p class="result-target">Цель: игрок ${m.targetPlayerIndex + 1} — ${targetEx ? 'изгнан' : 'в бункере'} · Носитель миссии: ${holderEx ? 'изгнан' : 'в бункере'}</p>
        <div class="result-badge">${txt}</div>
      </div>`;
    }).join('');
    mainContent.innerHTML = `
      <div class="results-screen">
        <h2>🏁 ИТОГИ ИГРЫ</h2>
        <p class="results-summary">Выживших: ${this.players.length - this.exiled.size} из ${this.players.length} · Раскрыто миссий: ${this.missionSystem.missions.length}</p>
        <div class="results-list">${list || '<p>В этой игре миссий не было.</p>'}</div>
        <div class="game-actions">
          <button class="action-btn" id="backToGameBtn">← Вернуться к игре</button>
          <button class="action-btn" id="toMenuBtn">🏠 В меню</button>
        </div>
      </div>`;
    mainContent.querySelector('#backToGameBtn').addEventListener('click', () => this.showGameScreen());
    mainContent.querySelector('#toMenuBtn').addEventListener('click', () => this.showMainMenu());
  }
  showPersonalMission(playerIndex) {
    const mission = this.missionSystem.getMissionForPlayer(playerIndex);
    if (!mission) return;
    const modal = document.createElement('div');
    modal.className = 'modal mission-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
      <div class="modal-content mission-content-box">
        <span class="close-mission">&times;</span>
        <h2>🎯 СЕКРЕТНАЯ МИССИЯ</h2>
        <div class="mission-type-badge-large">${mission.name}</div>
        <div class="rules-section">
          <h3 class="mission-title">${mission.description}</h3>
          <div class="mission-details">${mission.details}</div>
        </div>
        <div class="mission-warning-orange"><p>⚠️ НИКОМУ не показывайте эту миссию! Держите её в строгом секрете!</p></div>
        <button class="action-btn accept-mission-btn">Понятно, миссия принята!</button>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('.close-mission').addEventListener('click', close);
    modal.querySelector('.accept-mission-btn').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  }
}

document.addEventListener('DOMContentLoaded', function () { window.game = new BunkerGame(); setupSupportModal(); });

function copyCardNumber() {
  const cardNumber = '2202208150809037';
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = cardNumber; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    alert('Номер карты скопирован! 2202 2081 5080 9037');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(cardNumber).then(() => alert('Номер карты скопирован! 2202 2081 5080 9037')).catch(fallback);
  } else fallback();
}
function setupSupportModal() {
  const supportBtn = document.getElementById('supportBtn');
  const supportModal = document.getElementById('supportModal');
  if (!supportBtn || !supportModal) return;
  const closeSupport = supportModal.querySelector('.close');
  supportBtn.addEventListener('click', () => { supportModal.style.display = 'block'; });
  if (closeSupport) closeSupport.addEventListener('click', () => { supportModal.style.display = 'none'; });
  window.addEventListener('click', (e) => { if (e.target === supportModal) supportModal.style.display = 'none'; });
}