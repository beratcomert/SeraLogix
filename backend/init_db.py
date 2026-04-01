import models
from database import SessionLocal, engine
from services.auth_service import get_password_hash

def init_db():
    print("Veritabanı tabloları oluşturuluyor...")
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # 1. Admin Kullanıcısı Oluştur
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin_user:
        print("Admin kullanıcısı oluşturuluyor...")
        new_admin = models.User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(new_admin)
        print("Admin oluşturuldu: admin / admin123")
    else:
        print("Admin zaten mevcut.")
        
    # 2. Test Kullanıcısı Oluştur
    test_user = db.query(models.User).filter(models.User.username == "berat").first()
    if not test_user:
        print("Test kullanıcısı oluşturuluyor...")
        new_user = models.User(
            username="berat",
            hashed_password=get_password_hash("berat123"),
            role="user"
        )
        db.add(new_user)
        print("Test kullanıcısı oluşturuldu: berat / berat123")
    else:
        print("Test kullanıcısı zaten mevcut.")
        
    db.commit()
    db.close()
    print("Veritabanı hazır!")

if __name__ == "__main__":
    init_db()
