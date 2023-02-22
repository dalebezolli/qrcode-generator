const mask = [
	{mask: 0b000, pattern: (i, j) => (i + j) % 2},
	{mask: 0b001, pattern: (i, j) => (i) % 2},
	{mask: 0b010, pattern: (i, j) => (j) % 3},
	{mask: 0b011, pattern: (i, j) => (i + j) % 3},
	{mask: 0b100, pattern: (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2},
	{mask: 0b101, pattern: (i, j) => (i * j) % 2 + (i * j) % 3},
	{mask: 0b110, pattern: (i, j) => ((i * j) % 2 + (i * j) % 3) % 2},
	{mask: 0b111, pattern: (i, j) => ((i + j) % 2 + (i * j) % 3) % 2},
]

export {mask};