const mask = [
	{mask: 0b000, pattern: (row, column) => (row + column) % 2},
	{mask: 0b001, pattern: (row, column) => (row) % 2},
	{mask: 0b010, pattern: (row, column) => (column) % 3},
	{mask: 0b011, pattern: (row, column) => (row + column) % 3},
	{mask: 0b100, pattern: (row, column) => (Math.floor(row / 2) + Math.floor(column / 3)) % 2},
	{mask: 0b101, pattern: (row, column) => (row * column) % 2 + (row * column) % 3},
	{mask: 0b110, pattern: (row, column) => ((row * column) % 2 + (row * column) % 3) % 2},
	{mask: 0b111, pattern: (row, column) => ((row + column) % 2 + (row * column) % 3) % 2},
]

export {mask};