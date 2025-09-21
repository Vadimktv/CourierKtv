const assert = require('assert');
const { parseCourierText, normalizePhoneDigits } = require('../src/server/utils/parser');

function expectEqual(actual, expected, message) {
  assert.strictEqual(actual, expected, message);
}

function run() {
  const exampleText = 'Адрес улица Ленина 10, сумма 1500 рублей, телефон восемь девятьсот';
  const parsed = parseCourierText(exampleText);
  expectEqual(parsed.address, 'Улица Ленина 10', 'Address must be detected');
  expectEqual(parsed.amount, 1500, 'Amount should equal 1500');
  expectEqual(parsed.phone, null, 'Phone should not be parsed from words');

  const directPhone = normalizePhoneDigits('89181234567');
  expectEqual(directPhone, '+79181234567', 'Phone normalization works');

  const fullText = 'Адрес улица Победы 5 квартира 12 сумма 2 450 рублей телефон +7 (918) 777-44-55';
  const fullParsed = parseCourierText(fullText);
  expectEqual(fullParsed.address, 'Улица Победы 5 Квартира 12', 'Complex address parsed');
  expectEqual(fullParsed.amount, 2450, 'Amount 2450 extracted');
  expectEqual(fullParsed.phone, '+79187774455', 'Phone extracted');

  const fallbackText = 'Улица Центральная 3 телефон 89185553322';
  const fallbackParsed = parseCourierText(fallbackText);
  expectEqual(fallbackParsed.address, 'Улица Центральная 3', 'Address fallback works');
  expectEqual(fallbackParsed.amount, null, 'Amount is missing');
  expectEqual(fallbackParsed.phone, '+79185553322', 'Phone extracted from fallback');

  console.log('Parser smoke tests passed');
}

run();
