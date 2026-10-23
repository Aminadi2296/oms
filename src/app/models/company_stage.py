from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base

class CompanyStage(Base):
    __tablename__ = "company_stages"
    __table_args__ = (UniqueConstraint('company_id', 'position', name='uq_company_stage_position'),)

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String, nullable=False)
    position = Column(Integer, nullable=False)
    is_final = Column(Boolean, default=False)

    # relationship back to company (optional)
    company = relationship('Company', back_populates='stages')
