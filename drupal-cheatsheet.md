
# Drupal Code Snippet Cheat Sheet

---

## Routing and Controllers

**Routing YAML**
```yaml
my_module.my_route:
  path: '/custom/path'
  defaults:
    _controller: '\Drupal\my_module\Controller\MyController::myMethod'
    _title: 'My Page Title'
  requirements:
    _permission: 'access content'
```

**Basic Controller**
```php
namespace Drupal\my_module\Controller;

use Drupal\Core\Controller\ControllerBase;

class MyController extends ControllerBase {
  public function myMethod() {
    return [
      '#markup' => $this->t('Hello World!'),
    ];
  }
}
```

---

## Services and Dependency Injection

**Define a service**
```yaml
services:
  my_module.my_service:
    class: Drupal\my_module\Service\MyService
    arguments: ['@entity_type.manager', '@logger.channel.my_module']
```

**Basic Service Class**
```php
namespace Drupal\my_module\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Psr\Log\LoggerInterface;

class MyService {
  protected $entityTypeManager;
  protected $logger;

  public function __construct(EntityTypeManagerInterface $entityTypeManager, LoggerInterface $logger) {
    $this->entityTypeManager = $entityTypeManager;
    $this->logger = $logger;
  }

  public function doSomething() {
    $this->logger->info('Doing something');
  }
}
```

---

## Plugins

**Basic Plugin (e.g. Block)**
```php
namespace Drupal\my_module\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * @Block(
 *   id = "my_custom_block",
 *   admin_label = @Translation("My Custom Block")
 * )
 */
class MyCustomBlock extends BlockBase {
  public function build() {
    return ['#markup' => $this->t('Hello from my custom block!')];
  }
}
```

---

## Event Subscribers

```php
namespace Drupal\my_module\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\HttpKernel\Event\ResponseEvent;

class MyEventSubscriber implements EventSubscriberInterface {
  public static function getSubscribedEvents() {
    return [
      KernelEvents::RESPONSE => 'onResponse',
    ];
  }

  public function onResponse(ResponseEvent $event) {
    $response = $event->getResponse();
    $response->headers->set('X-Custom-Header', 'Value');
  }
}
```

---

## Custom Permissions

**permissions.yml**
```yaml
my_module.custom_permission:
  title: 'My Custom Permission'
  description: 'Allows users to do something special.'
```

**Usage in Routing**
```yaml
requirements:
  _permission: 'my_module.custom_permission'
```

---

## Form Alter

```php
function my_module_form_alter(&$form, \Drupal\Core\Form\FormStateInterface $form_state, $form_id) {
  if ($form_id === 'user_register_form') {
    $form['my_custom_field'] = [
      '#type' => 'textfield',
      '#title' => t('My Custom Field'),
    ];
  }
}
```

---

## Entity Query

```php
$nodes = \Drupal::entityTypeManager()
  ->getStorage('node')
  ->getQuery()
  ->condition('type', 'article')
  ->condition('status', 1)
  ->range(0, 5)
  ->execute();

$loaded_nodes = \Drupal\node\Entity\Node::loadMultiple($nodes);
```

---

## Menu Link

**my_module.links.menu.yml**
```yaml
my_module.custom_link:
  title: 'My Link'
  route_name: my_module.my_route
  parent: main-menu
  weight: 5
```

---

## Custom Field Formatter

```php
namespace Drupal\my_module\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;

/**
 * @FieldFormatter(
 *   id = "my_custom_formatter",
 *   label = @Translation("My Custom Formatter"),
 *   field_types = {"string"}
 * )
 */
class MyCustomFormatter extends FormatterBase {
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $elements = [];
    foreach ($items as $delta => $item) {
      $elements[$delta] = ['#markup' => '<strong>' . $item->value . '</strong>'];
    }
    return $elements;
  }
}
```

---

## Sending Email

```php
$mailManager = \Drupal::service('plugin.manager.mail');
$params['subject'] = 'Test email';
$params['message'] = 'Hello from Drupal!';
$mailManager->mail('my_module', 'custom_mail', 'example@example.com', \Drupal::currentUser()->getPreferredLangcode(), $params);
```

---

## Caching Snippet

**Cacheable Metadata**
```php
use Drupal\Core\Cache\CacheableMetadata;

$build = [
  '#markup' => 'Hello World',
];

$cache_metadata = new CacheableMetadata();
$cache_metadata->addCacheTags(['node_list']);
$cache_metadata->applyTo($build);
```

---

## 📚 Useful Services

| Service ID                 | Description           |
|----------------------------|-----------------------|
| entity_type.manager        | Entity manager        |
| database                   | Database connection   |
| logger.channel.my_module   | Logger                |
| current_user               | Current user object   |
| module_handler             | Module services       |
| config.factory             | Config service        |
