const getDataByDays = (entries, days) => {
  days *= -1;
  const currentDays = entries.slice(days);
  const previousDays = entries.slice(days * 2, days);
  const getTotal = (days) =>
    days.reduce(
      (total, [, data]) => total + (data?.clicks || 0) + (data?.scans || 0),
      0,
    );

  const currSum = getTotal(currentDays);
  const preSum = getTotal(previousDays);

  const isGrowth = currSum >= preSum;
  const diff = Math.abs(currSum - preSum);

  const percentage = preSum === 0 ? currSum : Math.round((diff / preSum) * 100);

  return {
    isGrowth,
    percentage,
    isPercentage: !!preSum,
    currValue: currSum,
  };
};

const getGraphDataByDays = (entries, days) => {
  days *= -1;
  const lastDays = entries.slice(days);
  const clicks = [],
    scans = [],
    total = [];
  lastDays.forEach(([, data]) => {
    clicks.push(data.clicks);
    scans.push(data.scans);
    total.push(data.clicks + data.scans);
  });
  return {
    clicks,
    scans,
    total,
  };
};

const getTopNData = (data, n) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  const topEntries = entries.slice(0, n);

  const result = {
    value: {},
    percentage: {},
  };

  let topPercentage = 0;
  let topValue = 0;

  for (const [key, value] of topEntries) {
    const percentage = Number(((value / total) * 100).toFixed(2));

    result.value[key] = value;
    result.percentage[key] = percentage;

    topValue += value;
    topPercentage += percentage;
  }

  if (entries.length > n) {
    result.value.others = total - topValue;
    result.percentage.others = Number((100 - topPercentage).toFixed(2));
  }

  return result;
};

const totalActionIsLastNDays = (action, data, n) => {
  let entries = data.slice(-1 * n);
  let sum = entries.reduce((acc, pair) => acc + pair[1][action], 0);
  return sum;
};

const get90DaysDataAsArray = (daily) => {
  const result = [];

  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const record = daily[dateKey] ?? { clicks: 0, scans: 0 };
    console.log([dateKey, record]);
    result.push([dateKey, record]);
  }
  return result;
};

module.exports = {
  get90DaysDataAsArray,
  totalActionIsLastNDays,
  getDataByDays,
  getTopNData,
  getGraphDataByDays,
};
