from suite_backend_core import create_app
from suite_backend_core.vista import MemoryPreferenceStore, make_vista_router
from suite_backend_core.vista_claims import make_claims_dependency

from .errors import install_error_handlers
from .routes import router
from .vista import load_vista_spec

app = create_app()
install_error_handlers(app)
app.include_router(router)
app.include_router(
    make_vista_router(
        load_vista_spec(), MemoryPreferenceStore(), make_claims_dependency("stayfinder"), "stayfinder"
    )
)
