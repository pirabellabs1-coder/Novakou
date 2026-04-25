## ADDED Requirements

### Requirement: Order creation SHALL track order_placed conversion
Quand un client passe une commande, le systeme MUST creer un event `order_placed` avec `entityType: "service"`, `entityId: serviceId`, et les metadata `orderId`, `amount`, `clientId`, `freelanceId`.

#### Scenario: Conversion tracked on order
- **WHEN** un client commande le service "Web Design" a 150 EUR
- **THEN** un event `order_placed` est cree avec `entityId: serviceId`, `metadata: { orderId, amount: "150", clientId, freelanceId }`

### Requirement: Tracking store SHALL compute conversion rate per service
Le tracking store MUST exposer `getConversionRate(serviceId)` qui retourne `{ views, orders, rate }` ou `rate = (orders / views) * 100`.

#### Scenario: Conversion rate calculated
- **WHEN** un service a 100 `service_viewed` et 5 `order_placed`
- **THEN** `getConversionRate(serviceId)` retourne `{ views: 100, orders: 5, rate: 5.0 }`

#### Scenario: Zero views returns zero rate
- **WHEN** un service n'a aucun `service_viewed`
- **THEN** `getConversionRate(serviceId)` retourne `{ views: 0, orders: 0, rate: 0 }`
