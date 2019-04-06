document.addEventListener("DOMContentLoaded", () => {
 
  class nBodyProblem {
    constructor(params) {
      this.g = params.g;
      this.dt = params.dt;
      this.softeninConstant = params.softeninConstant;
      this.masses = params.masses;
    }

    // Создаём функцию обновления значения позиции тел
    updatePositionVectors() {
      const massesLen = this.masses.length;

      for (let i = 0; i < massesLen; i++) {
        const massI = this.masses[i];
        massI.x += massI.vx * this.dt;
        massI.y += massI.vy * this.dt;
        massI.z += massI.vz * this.dt;
      }

      return this;
    }

    // Создаём функцию обновления скорости тел
    updateVelocityVectors() {
      const massesLen = this.masses.length;

      for (let i = 0; i < massesLen; i++) {
        const massI = this.masses[i];

        massI.vx += massI.ax * this.dt;
        massI.vy += massI.ay * this.dt;
        massI.vz += massI.az * this.dt;
      }
    }

    // Создаём функцию обновления векторов ускорения всех тел
    // masses - масса тел
    // g - гравитационная постоянная = 39,5
    // softeninConstant - константа размегчения
    updateAccelerationVectors() {
      const massesLen = this.masses.length;

      // ПРоход по всему массиву тел
      for (let i = 0; i < massesLen; i++) {
        // Первоначальное ускорение во всех векторах
        let ax = 0,
            ay = 0,
            az = 0;

        // Вектор ускорения
        const massI = this.masses[i];

        // Для каждого тела вычисляем влияние на ускорение других тел
        for (let j = 0; j < massesLen; j++) {
          if (i !== j) {
            const massJ = this.masses[j];

            const dx = massJ.x - massI.x;
            const dy = massJ.y - massI.y;
            const dz = massJ.z - massI.z;

            // Сумма квадратов растояния между massI и massJ по осям x, y, z
            const distSq = Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2);

            // Вичесление гравитационной силы взаимодействия 
            // f = g * massJ.m / dSq * (dSq + s)^(1/2)
            const f = (this.g * massJ.m) / (distSq * Math.sqrt(distSq + this.softeninConstant));

            // Расчёт ускорения по вектрам
            ax += dx * f;
            ay += dy * f;
            az += dz * f;
          }
        }

        massI.ax = ax;
        massI.ay = ay;
        massI.az = az;
      }
      return this;
    }
  }

  const g = 39.5,
        dt = 0.008; // Шаг по времени моделирования 
                    // 0,008 года равно 2,92 дня
        softeninConstant = 0,15;

  // Массив с небесными телами
  const masses = [
    {
      name: "Солнце", // В качестве единицы массы используем солнечную,
                  // поэтому масса Солнца равна 1
      m: 1,
      x: -1.50324727873647e-6,
      y: -3.93762725944737e-6,
      z: -4.86567877183925e-8,
      vx: 3.1669325898331e-5,
      vy: -6.85489559263319e-6,
      vz: -7.90076642683254e-7 
    },
    {
      name: "Меркурий",
      m: 1.65956463e-7,
      x: -0.346390408691506,
      y: -0.272465544507684,
      z: 0.00951633403684172,
      vx: 4.25144321778261,
      vy: -7.61778341043381,
      vz: -1.01249478093275
    }, {
      name: "Венера",
      m: 2.44699613e-6,
      x: -0.168003526072526,
      y: 0.698844725464528,
      z: 0.0192761582256879,
      vx: -7.2077847105093,
      vy: -1.76778886124455,
      vz: 0.391700036358566
    }, {
      name: "Земля",
      m: 3.0024584e-6,
      x: 0.648778995445634,
      y: 0.747796691108466,
      z: -3.22953591923124e-5,
      vx: -4.85085525059392,
      vy: 4.09601538682312,
      vz: -0.000258553333317722
    }, {
      name: "Марс",
      m: 3.213e-7,
      x: -0.574871406752105,
      y: -1.395455041953879,
      z: -0.01515164037265145,
      vx: 4.9225288800471425,
      vy: -1.5065904473191791,
      vz: -0.1524041758922603
    }
  ];
  
  // Экземпляр класса
  const innerSolarSystem = new nBodyProblem({
    g,
    dt, 
    masses: JSON.parse(JSON.stringify(masses)),
    softeninConstant
  });

  /* СОЗДАНИЕ ВИЗУАЛЬНОГО ОТОБРАЖЕНИЯ НЕБЕСНЫХ ТЕЛ */

  // Создадим класс, который является шаблоком для визуального отображения тел
  // Принимает 3 аргумента:
  // ctx - контекст рисования для элемента canvas
  // trailLength - длина таректории движения тела (его след)
  // radius - радиус круга, который представляет текущее положение тела

  class Manifestation {
    constructor (ctx, trailLength, radius) {
      this.ctx = ctx;
      this.trailLength = trailLength;
      this.radius = radius;

      // Массив, который хранит текущее и предыдущее положение позиции тела
      this.positions = [];
    }

    // Заполение массива координатами. 1 - объект = 1 положение
    statePosition(x, y) {
      // Добавление объекта
      this.positions.push({x, y});

      // Проверка. Если длина массива больше максимальной длины
      // то удаляем первый объект из массива
      if (this.positions.length > this.trailLength) {
        this.positions.shift();
      }
    }

    // Отрисовка траектории движения
    draw(x, y) {
      // Создание новой позиции в массиве positions
      this.statePosition(x, y);

      const positionsLen = this.positions.length;

      for (let i = 0; i < positionsLen; i++) {
        let transparency, // Прозрачность
            circleScaleFactor; 
        
        // Коэфицент удалённости от текущей позиции 
        const scaleFactor = i / positionsLen;

        if (i === positionsLen - 1) {
          transparency = 1;
          circleScaleFactor = 1;
        } else {
          transparency = scaleFactor / 2;
          circleScaleFactor = scaleFactor;
        }

        this.ctx.beginPath();
        this.ctx.arc(
          this.positions[i].x,
          this.positions[i].y,
          circleScaleFactor * this.radius,
          0,
          2 * Math.PI
        );
        this.ctx.filStyle = `rgba(0, 12, 153, ${transparency})`;
        this.ctx.fill();
      }
    }
  }

  const canvas = document.querySelector("#canvas"),
        ctx = canvas.getContext("2d");

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);

  const scale = 70,
        radius = 4,
        trailLength = 35;

  const populateManifestations = masses => {
    masses.forEach(
      mass =>
        (mass["manifestation"] = new Manifestation (
          ctx,
          trailLength,
          radius
        ))
    );
  };

  populateManifestations(innerSolarSystem.masses);

  // Кнопка сброса
  document.querySelector("#reset-button").addEventListener('click', () => {
    innerSolarSystem.masses = JSON.parse(JSON.stringify(masses));
    populateManifestations(innerSolarSystem.masses);
  }, false);

  /* ДОБАВЛЕНИЕ НОВЫХ ТЕЛ В СИМУЛЯЦИЮ */

  let mousePressX = 0,
    mousePressY = 0;

  let currentMouseX = 0,
    currentMouseY = 0;

  let dragging = false; // Хранит значение перемещается мышь или нет

  canvas.addEventListener("mousedown", (e) => {
    mousePressX = e.clientX;
    mousePressY = e.clientY;
    dragging = true;
  }, false);

  canvas.addEventListener("mousemove", (e) => {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
  }, false);

  const massesList = document.querySelector("#masses-list");

  canvas.addEventListener("mouseup", (e) => {
    const x = (mousePressX - width / 2) / scale;
    const y = (mousePressY - height / 2) / scale;
    const z = 0;
    const vx = (e.clientX - mousePressX) / 35;
    const vy = (e.clientY - mousePressY) / 35;
    const vz = 0;

    innerSolarSystem.masses.push({
      m: parseFloat(massesList.value),
      x, y, z, vx, vy, vz,
      manifestation: new Manifestation(ctx, trailLength, radius)
    });

    dragging = false;
  }, false);

  // Метод отрисовки. 60 FPS

  const animate = () => {
    innerSolarSystem.updatePositionVectors()
      .updateAccelerationVectors()
      .updateVelocityVectors();

    ctx.clearRect(0, 0, width, height);
    const massesLen = innerSolarSystem.masses.length;

    for (let i = 0; i < massesLen; i++) {
      const massI = innerSolarSystem.masses[i];

      const x = width / 2 + massI.x * scale;
      const y = height / 2 + massI.y * scale;

      massI.manifestation.draw(x, y);

      if (massI.name) {
        ctx.font = "14px Arial";
        ctx.fillText(massI.name, x + 12, y + 4);
        ctx.fill();
      }

      if (x < radius || x > width - radius) massI.vx = -massI.vx;

      if (y < radius || y > height - radius) massI.vy = -massI.vy;
    }

    if (dragging) {
      ctx.beginPath();
      ctx.moveTo(mousePressX, mousePressY);
      ctx.lineTo(currentMouseX, currentMouseY);
      ctx.storeStyle = "red";
      ctx.stroke();
    }

    requestAnimationFrame(animate);
  }

  

  animate();


});