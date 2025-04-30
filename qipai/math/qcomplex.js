export function complex(re, im = 0) {
  return { re, im };
}

export function add(a, b) {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function multiply(a, b) {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function conjugate(c) {
  return { re: c.re, im: -c.im };
}

export function expi(theta) {
  // e^(i*theta) = cos(theta) + i*sin(theta)
  return { re: Math.cos(theta), im: Math.sin(theta) };
}

export function magnitude(c) {
  return Math.sqrt(c.re ** 2 + c.im ** 2);
}

export function phase(c) {
  return Math.atan2(c.im, c.re);
}

// Add other necessary complex operations as needed...
