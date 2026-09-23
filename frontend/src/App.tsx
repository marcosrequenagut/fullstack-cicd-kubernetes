import {useState, useEffect} from 'react'

interface OrderItem {
  order_id: string
  order_item_id: number
  product_id: string
  seller_id: string
  shipping_limit_date: string
  price: number
  freight_value: number
}

function App() {
  const[items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    fetch('/api/order-items')
    .then((response) => response.json())
    .then((data) => setItems(data))
  }, [])

  return (
    <table>
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Order_item_id</th>
          <th>Product_id</th>
          <th>Seller_id</th>
          <th>Shipping_limit_date</th>
          <th>Price</th>
          <th>freight_value</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td>{item.order_id}</td>
            <td>{item.order_item_id}</td>
            <td>{item.product_id}</td>
            <td>{item.seller_id}</td>
            <td>{item.shipping_limit_date}</td>
            <td>{item.price}</td>
            <td>{item.freight_value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default App