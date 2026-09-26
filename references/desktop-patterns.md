# Desktop workspaces and JavaFX

Use for resizable tools, document editors, media workspaces and operational
dashboards. The aim is consistent command and resource ownership, not a new
application framework. Preserve the existing build, packaging and view model.

## Build a shell around work

Choose a main content owner, navigation/selection state and a command path.
Menus, shortcuts, context actions and toolbars should invoke the same command
with the same enabled state. An action should not skip validation or undo just
because it came from a keyboard accelerator.

Store window geometry only when useful and restore it inside available display
bounds. A narrow window can replace a detail pane with a reachable view or
drawer. Crossing a composition boundary should not reset the document, rebuild
all controls on every pixel, or lose keyboard focus.

## JavaFX construction choices

Inspect the Java/JavaFX versions, Maven/Gradle modules, modular/classpath launch,
FXML or programmatic construction, CSS and resources before editing.

| Relationship | Starting pane/control | Common error |
| --- | --- | --- |
| Major regions | `BorderPane` | Fixed-size children prevent useful shrinkage |
| Aligned labels and fields | `GridPane` | Every input is independently bound to scene width |
| Resizable editor areas | `SplitPane` | Recreating panes discards selection and listeners |
| Overlay over an existing view | `StackPane` | Hidden overlay remains in the input/focus path |
| Large repeated data | `TableView`, `ListView`, `TreeView` | One heavyweight node for every record |
| Dense waveform or spectrum | `Canvas` or the existing renderer | Thousands of scene nodes rebuilt on every tick |

Use min/pref/max sizes and growth priorities deliberately. A controller can
wire a view without becoming a service locator. Bind genuine relationships
instead of forwarding the same value through several listeners.

JavaFX CSS is not browser CSS. Use supported properties, stable style classes
and semantic pseudo-classes for selected, invalid or busy state. Keep the
focus appearance usable in the resulting skin. Load resources through the
project's packaged-resource mechanism, not a developer's working directory.

## Cancellable background work

Run blocking work through the existing executor and JavaFX `Task`/`Service`
where appropriate. The worker must cooperate with cancellation; a cancelled
wrapper cannot forcibly make arbitrary blocking I/O safe. Publish scene-graph
updates on the JavaFX Application Thread and ignore results whose owning view
has closed or whose request has been superseded.

A minimal lifecycle is: capture immutable request → mark loading → run worker →
apply the current result or actionable error → release bindings/listeners.
Cancel superseded work, distinguish cancellation from failure, and shut down
application-owned executors at their real lifetime boundary. Do not create an
unbounded thread for every click. See [JavaFX Task](https://openjfx.io/javadoc/25/javafx.graphics/javafx/concurrent/Task.html)
for its threading and cancellation contract; match the project's installed version.

## Three workspace recipes

**Dashboard:** shared filters → current dataset → derived totals/table/chart →
refresh state. Keep stale usable data distinguishable from a new empty dataset.
Move substantial filtering off the interaction thread. Provide exact values
beside an important visual comparison.

**Editor:** document → selection → commands/history → validation → persistence.
Set dirty state from actual document changes, not every control event. Preserve
the document after a failed save; handle external conflicts according to the
product. Long import/export is cancellable. Closing a document releases its
watchers, previews and listeners, not resources shared by other windows.

**Media:** one playback owner → explicit loading/ready/playing/paused/ended/error
states → bounded progress updates → disposal when replaced. A screen closing
must not leave old audio playing. Keep transport actions and keyboard commands
consistent; analysis data should update a drawing surface without rebuilding
the layout at audio frequency.

## Reused-cell checklist

Before attaching a new item, detach listeners from the previous item. For each
update, clear or set text, graphic, tooltip, styles/pseudo-classes, accessibility
content and item-specific handlers. Empty cells are a separate update path.
Reuse a test sequence with a warning item, a normal item and an empty cell in
the same cell instance; a correct first render does not prove reuse safety.

## Other desktop families

| Stack | Keep with the existing owner | Targeted verification |
| --- | --- | --- |
| WPF | Bindings, routed commands, dispatcher updates, collection views | DPI changes, virtualization and keyboard activation |
| WinUI | Window lifetime, commands, focus and adaptive panes | Resize while selection and a dialog are active |
| UWP | Lifecycle state, focus and adaptive views | Suspend/resume and retained navigation |
| Avalonia | View-model commands, resource resolution, platform services | Shipped OS input, window scaling and font metrics |
| Uno | Shared state with target-specific presentation/services | The actual target's controls, permissions and focus |

Do not assume web screenshots demonstrate any of these targets. For JavaFX,
compile the affected module, launch the actual screen, then inspect the packaged
artifact if packaging changed: CSS, FXML, fonts, native media and module resources
can work in the IDE and still be missing from the distribution. Use existing
TestFX or platform automation only where the project already owns it or the
requested test genuinely warrants it.
