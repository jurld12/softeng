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