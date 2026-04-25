## Spec: Ranking Algorithms

### Service Score (Landing Page — Top Performers)

```
score = (rating / 5) * 0.40
      + min(orderCount / 50, 1) * 0.35
      + min(reviewCount / 30, 1) * 0.25
```

Filtres: `rating >= 3.5`, `orderCount >= 1`, `status IN (ACTIF, VEDETTE)`

### Service Score (Landing Page — Trending)

```
score = min(views_7days / 200, 1) * 0.30
      + min(orders_7days / 10, 1) * 0.40
      + (rating / 5) * 0.30
```

Filtre: `createdAt > 7 days ago`, `views_7days >= 1`

Note: `views_7days` = count ServiceView where createdAt >= now - 7 days
      `orders_7days` = count Order where createdAt >= now - 7 days and serviceId matches

### Boost Score (Sponsored Services)

```
boostScore = (totalCost / maxTotalCost) * 0.30
           + CTR * 0.30
           + conversionRate * 0.20
           + timeDecay(startedAt, 7) * 0.20

CTR = actualClicks / max(actualImpressions, 1)
conversionRate = actualOrders / max(actualClicks, 1)
timeDecay(date, halfLife) = 1 / (1 + daysSince(date) / halfLife)
```

Default pour nouveau boost (pas d'historique): CTR = 0.01, conversionRate = 0

### Freelance Score

```
score = (avgRating / 5) * 0.35
      + min(completedOrders / 20, 1) * 0.25
      + completionRate * 0.20
      + min(reviewCount / 30, 1) * 0.10
      + min(serviceCount / 5, 1) * 0.10
```

### Rising Talent Bonus

```
isRisingTalent = accountAge < 90 days
              AND completedOrders >= 1
              AND avgRating >= 4.0
              AND reviewCount >= 1

risingBonus = isRisingTalent ? 0.30 : 0
effectiveScore = score * (1 + risingBonus)
```

### Weighted Random Selection

```
function weightedRandomPick(items, weights, count, seed):
  rng = seededRandom(seed)
  results = []
  pool = [...items]
  poolWeights = [...weights]

  for i in 0..count:
    totalWeight = sum(poolWeights)
    target = rng.next() * totalWeight
    cumulative = 0
    for j in 0..pool.length:
      cumulative += poolWeights[j]
      if cumulative >= target:
        results.push(pool[j])
        pool.splice(j, 1)
        poolWeights.splice(j, 1)
        break

  return results
```

### Category Diversity Enforcement

```
function enforceDiversity(items, maxPerCategory):
  categoryCounts = {}
  result = []
  overflow = []

  for item in items:
    cat = item.category
    if (categoryCounts[cat] || 0) < maxPerCategory:
      result.push(item)
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    else:
      overflow.push(item)

  // Fill remaining slots from overflow if result < target
  while result.length < items.length and overflow.length > 0:
    result.push(overflow.shift())

  return result
```

### Hourly Seed

```
function hourlyHash(salt = ""):
  hour = floor(Date.now() / 3_600_000)  // Changes every hour
  str = `${hour}:${salt}`
  return simpleHash(str)  // DJB2 or similar fast hash

function simpleHash(str):
  hash = 5381
  for char in str:
    hash = ((hash << 5) + hash) + charCode(char)
  return hash >>> 0  // Unsigned 32-bit
```

### Interleave Algorithm (Marketplace Sponsored)

```
function interleave(boosted, regular, ratio=1/4):
  result = []
  boostIdx = 0
  regularIdx = 0
  position = 0

  while regularIdx < regular.length or boostIdx < boosted.length:
    // Every 4th position, try to insert a boosted service
    if position % 4 == 2 and boostIdx < boosted.length:
      result.push(boosted[boostIdx])
      boostIdx++
    else if regularIdx < regular.length:
      result.push(regular[regularIdx])
      regularIdx++
    else if boostIdx < boosted.length:
      result.push(boosted[boostIdx])
      boostIdx++
    position++

  return result
```

### Stats Formatting

```
function formatStatNumber(n):
  if n < 10:     return null  // Don't show embarrassingly low numbers
  if n < 100:    return String(n)
  if n < 1000:   return `${floor(n / 100) * 100}+`   // "100+", "200+", "900+"
  if n < 10000:  return `${(n / 1000).toFixed(1)}K+`  // "1.2K+", "5.8K+"
  return `${floor(n / 1000)}K+`                        // "10K+", "25K+"
```
