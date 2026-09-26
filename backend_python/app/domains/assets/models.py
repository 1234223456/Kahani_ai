"""
Assets domain: persistence models (MongoDB documents).
"""
COLLECTION = "generatedassets"


def asset_from_doc(doc: dict) -> dict:
    if not doc:
        return doc
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out["_id"])
    for key in ("createdAt", "updatedAt"):
        if key in out and hasattr(out.get(key), "isoformat"):
            out[key] = out[key].isoformat()
    return out
