import { Link } from 'react-router-dom'

function Home() {
    return(
        <div>
            <h1>Requena Club Sport Centre </h1>
            <Link to="/activities">
                <button>Book activity</button>
            </Link>
        </div>
    )
}

export default Home