fn colour(iteration: Int, offset: Int, scale: Int) -> Int {
    let iteration = (iteration * scale + offset).land(1023)
    if iteration < 256 {
      iteration
    } else if iteration < 512 {
      255 - (iteration - 255)
    } else {
      0
    }
}

fn iteration_equation(x0: Double, y0: Double, max_iterations: Int) -> Int {
  let mut a = 0.0
  let mut b = 0.0
  let mut rx = 0.0
  let mut ry = 0.0
  let mut ab = a * b
  let mut iterations = 0
  while iterations < max_iterations && rx * rx + ry * ry <= 4.0 {
    rx = a * a - b * b + x0;
    ab = a * b;
    ry = ab + ab + y0;
    a = rx;
    b = ry;
    iterations += 1;
  }
  iterations
}

fn scale(
  domain_start: Double,
  domain_length: Double,
  screen_length: Double,
  step: Double,
) -> Double {
  domain_start + domain_length * (step * (1.0 / screen_length) - 1.0);
}

fn mandelbrot(
  data: Array[Int],
  height: Int,
  width: Int,
  max_iterations: Int,
  cx: Double,
  cy: Double,
  diameter: Double,
) -> Unit {
  let verticalDiameter = (diameter * height.to_double()) / width.to_double();
  for y = 0; y < height; y = y + 1 {
    for x = 0; x < width; x = x + 1 {
      // convert from screen coordinates to mandelbrot coordinates
      let rx = scale(cx, diameter, width.to_double(), x.to_double());
      let ry = scale(cy, verticalDiameter, height.to_double(), y.to_double());
      let iterations = iteration_equation(rx, ry, max_iterations);
      let outside = iterations == max_iterations;
      let idx = (x + y * width).lsl(2);
      data[idx + 0] = if outside { max_iterations } else { colour(iterations, 0, 4) };
      data[idx + 1] = if outside { max_iterations } else { colour(iterations, 128, 4) };
      data[idx + 2] = if outside { max_iterations } else { colour(iterations, 356, 4) };
      data[idx + 3] = 255
    }
  }
}


pub fn entry() -> Unit {
  let width = 1200;
  let height = 800;
  let data = Array::make(width * height * 4, 0);
  mandelbrot(
    data,
    height,
    width,
    10000,
    -0.743644786,
    0.1318252536,
    0.00029336,
  );
}
