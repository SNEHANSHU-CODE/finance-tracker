"""
Shared base types for Pydantic models.
Import PyObjectId from here instead of redefining it in every model.
"""
from bson import ObjectId
from pydantic_core import core_schema


class PyObjectId(ObjectId):
    """
    Custom ObjectId type compatible with Pydantic v2.
    Defined once here; re-exported by each model module that needs it.
    """

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema(),
            serialization=core_schema.plain_serializer_function_ser_schema(str),
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError(f"Invalid ObjectId: {v!r}")