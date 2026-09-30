import { Link } from 'react-router-dom'

const activities = [
    { name: 'Padel', path: 'padel' },
    { name: 'Zumba', path: 'zumba' },
    { name: 'Pilates', path: 'pilates' },
    { name: 'Yoga', path: 'yoga' },
    { name: 'Spinning', path: 'spinning' },
]

function Activities() {
    return(
        <div>
            <h1>Choose an activity</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {activities.map((activity) => (
                <Link key={activity.path} to={`/activities/${activity.path}`}>
                    <button>{activity.name}</button>
                </Link>
                ))}
            </div>
        </div> 
    )
}

export default Activities