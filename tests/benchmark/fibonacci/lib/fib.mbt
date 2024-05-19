fn fibonacci(num: Int) -> Int {
  if num < 2 {
    num
  } else {
    fibonacci(num - 1) + fibonacci(num - 2)
  }
}

pub fn entry() -> Unit {
  fibonacci(35) |> ignore
}