let pi = 3.141592653589793;
let solar_mass: Double = 4.0 * pi * pi;
let days_per_year = 365.24;

priv struct NBody {
  mut x: Double;
  mut y: Double;
  mut z: Double;
  mut vx: Double;
  mut vy: Double;
  mut vz: Double;
  mass: Double;
}


fn jupiter() -> NBody {
  return {
    x: 4.8414314424647209,
    y: -1.16032004402742839,
    z: -1.03622044471123109e-1,
    vx: 1.66007664274403694e-3 * days_per_year,
    vy: 7.69901118419740425e-3 * days_per_year,
    vz: -6.90460016972063023e-5 * days_per_year,
    mass: 9.54791938424326609e-4 * solar_mass,
  };
}

fn saturn()-> NBody {
  return {
    x: 8.34336671824457987,
    y: 4.12479856412430479,
    z: -4.03523417114321381e-1,
    vx: -2.76742510726862411e-3 * days_per_year,
    vy: 4.99852801234917238e-3 * days_per_year,
    vz: 2.30417297573763929e-5 * days_per_year,
    mass: 2.85885980666130812e-4 * solar_mass,
  };
}

fn uranus()-> NBody {
  return {
    x: 1.2894369562139131e1,
    y: -1.51111514016986312e1,
    z: -2.23307578892655734e-1,
    vx: 2.96460137564761618e-3 * days_per_year,
    vy: 2.3784717395948095e-3 * days_per_year,
    vz: -2.96589568540237556e-5 * days_per_year,
    mass: 4.36624404335156298e-5 * solar_mass,
  };
}

fn neptune()-> NBody {
  return {
    x: 1.53796971148509165e1,
    y: -2.59193146099879641e1,
    z: 1.79258772950371181e-1,
    vx: 2.68067772490389322e-3 * days_per_year,
    vy: 1.62824170038242295e-3 * days_per_year,
    vz: -9.5159225451971587e-5 * days_per_year,
    mass: 5.15138902046611451e-5 * solar_mass,
  };
}

fn sun()-> NBody {
  return {
    x: 0.0,
    y: 0.0,
    z: 0.0,
    vx: 0.0,
    vy: 0.0,
    vz: 0.0,
    mass: solar_mass,
  };
}

let bodies: Array[NBody] = [sun(), jupiter(), saturn(), uranus(), neptune()];

fn offsetMomentum() -> Unit {
    let mut px = 0.0;
    let mut py = 0.0;
    let mut pz = 0.0;
    let size = bodies.length();
    for i = 0; i < size; i = i + 1 {
        let body = bodies[i];
        let mass = body.mass;
        px += body.vx * mass;
        py += body.vy * mass;
        pz += body.vz * mass;
    }

    let body = bodies[0];
    body.vx = -px / solar_mass;
    body.vy = -py / solar_mass;
    body.vz = -pz / solar_mass;
}

fn advance(dt: Double) -> Unit {
    let size = bodies.length();

    for i = 0; i < size; i = i + 1 {
        let bodyi = bodies[i];
        let mut vxi = bodyi.vx;
        let mut vyi = bodyi.vy;
        let mut vzi = bodyi.vz;
        for j = i + 1; j < size; j = j + 1 {
            let bodyj = bodies[j];
            let dx = bodyi.x - bodyj.x;
            let dy = bodyi.y - bodyj.y;
            let dz = bodyi.z - bodyj.z;

            let d2 = dx * dx + dy * dy + dz * dz;
            let mag = dt / (d2 * d2.sqrt());

            let massj = bodyj.mass;
            vxi = vxi - dx * massj * mag;
            vyi = vyi - dy * massj * mag;
            vzi = vzi - dz * massj * mag;

            let massi = bodyi.mass;
            bodyj.vx = bodyj.vx + dx * massi * mag;
            bodyj.vy = bodyj.vy + dy * massi * mag;
            bodyj.vz = bodyj.vz + dz * massi * mag;
        }
        bodyi.vx = vxi;
        bodyi.vy = vyi;
        bodyi.vz = vzi;

        bodyi.x = bodyi.x + dt * vxi;
        bodyi.y = bodyi.y + dt * vyi;
        bodyi.z = bodyi.z + dt * vzi;
    }
}

fn energy() -> Double {
    let mut e = 0.0;
    let size = bodies.length();

    for i = 0; i < size; i = i + 1 {
        let bodyi = bodies[i];

        e +=
            0.5 *
            bodyi.mass *
            (bodyi.vx * bodyi.vx + bodyi.vy * bodyi.vy + bodyi.vz * bodyi.vz);

        for j = i + 1; j < size; j = j + 1 {
            let bodyj = bodies[j];
            let dx = bodyi.x - bodyj.x;
            let dy = bodyi.y - bodyj.y;
            let dz = bodyi.z - bodyj.z;

            let distance = (dx * dx + dy * dy + dz * dz).sqrt();
            e -= (bodyi.mass * bodyj.mass) / distance;
        }
    }
    return e;
}

pub fn entry() -> Unit {
    let n = 1000000;
  offsetMomentum();
  energy() |> ignore;
  for i = 0; i < n; i = i + 1 {
    advance(0.01);
  }
  energy() |> ignore;
}