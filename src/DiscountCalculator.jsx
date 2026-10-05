import { useState } from "react";
import "./DiscountCalculator.css";

const CATEGORIES = [
  { id: "electronics", label: "Электроника", discount: 5 },
  { id: "clothing", label: "Одежда", discount: 15 },
  { id: "groceries", label: "Продукты", discount: 10 },
  { id: "books", label: "Книги", discount: 20 },
  { id: "other", label: "Другое", discount: 0 },
];

const VAT_RATE = 0.22;

function DiscountCalculator() {
  // 1. Список товаров
  const [items, setItems] = useState([
    { id: Date.now(), price: "", category: "electronics" },
  ]);

  // 2. Промокод
  const [promoCode, setPromoCode] = useState("");

  // 3. Кастомная скидка
  const [useCustomDiscount, setUseCustomDiscount] = useState(false);
  const [customDiscount, setCustomDiscount] = useState(0);

  // 4. Переключатель НДС
  const [includeVat, setIncludeVat] = useState(true);

  // Состояние расчёта и ошибок
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState("");

  // 5. История расчётов
  const [history, setHistory] = useState([]);

  // Обработчики изменения товаров
  function handleItemPriceChange(id, value) {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, price: value } : item))
      );
      setError("");
      setCalculated(false);
    }
  }

  function handleItemCategoryChange(id, value) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, category: value } : item))
    );
    setCalculated(false);
  }

  function handleAddItem() {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), price: "", category: "electronics" },
    ]);
    setCalculated(false);
  }

  function handleRemoveItem(id) {
    if (items.length === 1) {
      setError("Должен быть хотя бы один товар");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
    setError("");
    setCalculated(false);
  }

  // Расчёты
  const isPromoValid = promoCode.trim().toUpperCase() === "WELCOME10";
  const promoDiscountPercent = isPromoValid ? 10 : 0;

  // Вычисление данных по каждому товару
  const processedItems = items.map((item) => {
    const numPrice = parseFloat(item.price) || 0;
    const catObj = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[0];
    
    // Категорийная или кастомная скидка
    const baseDiscount = useCustomDiscount ? Number(customDiscount) : catObj.discount;
    const totalDiscountPercent = Math.min(baseDiscount + promoDiscountPercent, 100);

    const discountAmount = numPrice * (totalDiscountPercent / 100);
    const priceAfterDiscount = numPrice - discountAmount;
    const vatAmount = includeVat ? priceAfterDiscount * VAT_RATE : 0;
    const itemTotal = priceAfterDiscount + vatAmount;

    return {
      ...item,
      numPrice,
      categoryLabel: catObj.label,
      totalDiscountPercent,
      discountAmount,
      priceAfterDiscount,
      vatAmount,
      itemTotal,
    };
  });

  const subtotalPrice = processedItems.reduce((acc, i) => acc + i.numPrice, 0);
  const totalDiscountAmount = processedItems.reduce((acc, i) => acc + i.discountAmount, 0);
  const totalAfterDiscount = processedItems.reduce((acc, i) => acc + i.priceAfterDiscount, 0);
  const totalVat = processedItems.reduce((acc, i) => acc + i.vatAmount, 0);
  const grandTotal = processedItems.reduce((acc, i) => acc + i.itemTotal, 0);

  function handleCalculate() {
    // Валидация цен
    for (let i = 0; i < items.length; i++) {
      const p = parseFloat(items[i].price);
      if (!items[i].price.trim()) {
        setError(`Укажите цену для товара №${i + 1}`);
        setCalculated(false);
        return;
      }
      if (isNaN(p) || p <= 0) {
        setError(`Цена товара №${i + 1} должна быть положительным числом`);
        setCalculated(false);
        return;
      }
    }

    setError("");
    setCalculated(true);

    // Добавление в историю (сохраняем последние 5)
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      itemCount: items.length,
      grandTotal,
    };
    setHistory((prev) => [newRecord, ...prev].slice(0, 5));
  }

  function handleReset() {
    setItems([{ id: Date.now(), price: "", category: "electronics" }]);
    setPromoCode("");
    setUseCustomDiscount(false);
    setCustomDiscount(0);
    setIncludeVat(true);
    setCalculated(false);
    setError("");
  }

  function formatRub(val) {
    return val.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <div className="calculator-wrapper">
      <h2 className="calculator-title">Калькулятор скидок</h2>

      {/* Список товаров */}
      <div className="items-list">
        {items.map((item, idx) => (
          <div key={item.id} className="item-card">
            <div className="item-card__header">
              <span>Товар №{idx + 1}</span>
              {items.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="field">
              <label className="field__label">Цена (₽)</label>
              <input
                type="text"
                className="field__input"
                value={item.price}
                onChange={(e) => handleItemPriceChange(item.id, e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="field">
              <label className="field__label">Категория</label>
              <select
                className="field__input field__select"
                value={item.category}
                disabled={useCustomDiscount}
                onChange={(e) => handleItemCategoryChange(item.id, e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} — скидка {cat.discount}%
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn--add" onClick={handleAddItem}>
          + Добавить товар
        </button>
      </div>

      {/* Настройки скидок и НДС */}
      <div className="settings-section">
        {/* Кастомная скидка */}
        <div className="field field--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useCustomDiscount}
              onChange={(e) => {
                setUseCustomDiscount(e.target.checked);
                setCalculated(false);
              }}
            />
            Ручная (кастомная) скидка
          </label>
        </div>

        {useCustomDiscount && (
          <div className="field">
            <label className="field__label">Скидка: {customDiscount}%</label>
            <input
              type="range"
              min="0"
              max="50"
              value={customDiscount}
              onChange={(e) => {
                setCustomDiscount(e.target.value);
                setCalculated(false);
              }}
            />
          </div>
        )}

        {/* Промокод */}
        <div className="field">
          <label className="field__label">Промокод (WELCOME10 дает +10%)</label>
          <input
            type="text"
            className="field__input"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value);
              setCalculated(false);
            }}
            placeholder="Введите WELCOME10"
          />
          {isPromoValid && <span className="field__success">Промокод применён! (+10%)</span>}
        </div>

        {/* Переключатель НДС */}
        <div className="field field--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeVat}
              onChange={(e) => {
                setIncludeVat(e.target.checked);
                setCalculated(false);
              }}
            />
            Учитывать НДС (22%)
          </label>
        </div>
      </div>

      {error && <div className="field__error">{error}</div>}

      {/* Кнопки управления */}
      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={handleCalculate}>
          Рассчитать
        </button>
        <button type="button" className="btn btn--secondary" onClick={handleReset}>
          Сбросить
        </button>
      </div>

      {/* Результаты */}
      {calculated && !error && (
        <div className="results">
          <h3 className="results__title">Результаты расчёта</h3>
          <table className="results__table">
            <tbody>
              <tr>
                <td>Общая исходная цена</td>
                <td className="results__value">{formatRub(subtotalPrice)} ₽</td>
              </tr>
              <tr>
                <td>Общая сумма скидки</td>
                <td className="results__value results__value--discount">
                  −{formatRub(totalDiscountAmount)} ₽
                </td>
              </tr>
              <tr>
                <td>Сумма после скидки</td>
                <td className="results__value">{formatRub(totalAfterDiscount)} ₽</td>
              </tr>
              {includeVat && (
                <tr>
                  <td>НДС (22%)</td>
                  <td className="results__value">+{formatRub(totalVat)} ₽</td>
                </tr>
              )}
              <tr className="results__row--total">
                <td>Итого к оплате</td>
                <td className="results__value">{formatRub(grandTotal)} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* История расчётов */}
      {history.length > 0 && (
        <div className="history-section">
          <h3 className="history__title">История последних расчётов</h3>
          <ul className="history__list">
            {history.map((rec) => (
              <li key={rec.id} className="history__item">
                <span>[{rec.date}] Товаров: {rec.itemCount}</span>
                <strong>{formatRub(rec.grandTotal)} ₽</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DiscountCalculator;