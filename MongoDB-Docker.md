# Connect to MongoDB shell
docker exec -it healio-mongodb mongosh -u admin -p healio_dev_password

# Inside mongo shell, run these commands:
use healio                           # Switch to healio database
show collections                     # List all collections
db.users.find().pretty()            # View all users
db.biometrics.find().pretty()       # View all biometrics
db.alerts.find().pretty()           # View all alerts
db.achievements.find().pretty()     # View all achievements

# Count documents
db.users.countDocuments()

# Find specific user by email
db.users.findOne({email: "john@example.com"})

# Find biometrics for specific user (replace with actual user_id)
db.biometrics.find({user_id: "6968ffad8a6f8e1e1475b675"}).pretty()

# Exit mongo shell
exit
# View all users
docker exec healio-mongodb mongosh -u admin -p healio_dev_password --eval "use healio; db.users.find().pretty()"

# Count users
docker exec healio-mongodb mongosh -u admin -p healio_dev_password --eval "use healio; db.users.countDocuments()"

# View all biometrics
docker exec healio-mongodb mongosh -u admin -p healio_dev_password --eval "use healio; db.biometrics.find().pretty()"

# Get latest 5 biometric entries
docker exec healio-mongodb mongosh -u admin -p healio_dev_password --eval "use healio; db.biometrics.find().sort({timestamp: -1}).limit(5).pretty()"

# View all collections
docker exec healio-mongodb mongosh -u admin -p healio_dev_password --eval "use healio; db.getCollectionNames()"