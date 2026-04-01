from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# MySQL Bağlantı URL'si: mysql+pymysql://kullanici:sifre@host:port/veritabani_adi
DATABASE_URL = "mysql+pymysql://root:1234@localhost:3306/seralogix"

# MySQL için engine oluşturma
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)