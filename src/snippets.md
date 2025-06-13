---
layout: default
title: Drupal Snippets Cheatsheet
---
# Drupal Code Snippets Cheat Sheet
## Index

- [Routing and Controllers](#routing-and-controllers)
- [Services and Dependency Injection](#services-and-dependency-injection)
- [Plugins](#plugins)
- [Event Subscribers](#event-subscribers)
- [Custom Permissions](#custom-permissions)
- [Form Alter](#form-alter)
- [Entity Query](#entity-query)
- [Menu Link](#menu-link)
- [Custom Field Type](#custom-field-type)
- [Custom Field Formatter](#custom-field-formatter)
- [Custom Access Handler](#custom-access-handler)
- [Sending Email](#sending-email)
- [Caching Snippet](#caching-snippet)
- [Create a node programmatically](#create-a-node-programmatically)
- [Add a custom field programmatically](#add-a-custom-field-programmatically)


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
  #[Route('/custom/path', name: 'my_route')]
  public function myMethod() {
    return [
      '#markup' => $this->t('Hello World!'),
    ];
  }
}
```

Via **attributes**
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

via **attributes**
```php
namespace Drupal\my_module\Service;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\DependencyInjection\Attribute\AsService;

#[AsService(id: 'my_module.my_service')]
class MyService {
  protected $entityTypeManager;
  protected $logger;

  public function __construct(
    EntityTypeManagerInterface $entityTypeManager,
    #[Autowire(service:'logger.channel.my_module')]
    LoggerInterface $logger
  ) {
    $this->entityTypeManager = $entityTypeManager;
    $this->logger = $logger;
  }

  public function doSomething() {
    $this->logger->info('Doing something');
  }
}
```

**Controller Injection**
```php
namespace Drupal\my_module\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\my_module\Service\MyService;

class CustomPageController extends ControllerBase {
  protected $myService;

  public function __construct(CustomService $myService) {
    $this->myService = $myService;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('my_module.my_service')
    );
  }

  public function content() {
    $message = $this->myService->doSomething();
    // ...
  }
}
```

---

## Plugins

**Basic Plugin (e.g. Block)**
```php
namespace Drupal\my_module\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;

/**
 * @Block(
 *   id = "latest_articles_block",
 *   admin_label = @Translation("Latest Articles Block")
 * )
 */
class LatestArticlesBlock extends BlockBase implements ContainerFactoryPluginInterface {
  protected $entityTypeManager;

  public function __construct(array $configuration, $plugin_id, $plugin_definition, EntityTypeManagerInterface $entity_type_manager) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->entityTypeManager = $entity_type_manager;
  }

  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager')
    );
  }

  public function build() {
    $storage = $this->entityTypeManager->getStorage('node');
    $nodes = $storage->loadByProperties([
      'type' => 'article',
      'status' => 1,
    ]);
    $latest_nodes = array_slice($nodes, 0, 5);

    $items = [];
    foreach ($latest_nodes as $node) {
      $items[] = $node->toLink();
    }

    return [
      '#theme' => 'item_list',
      '#items' => $items,
    ];
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

**Event Subscriber registration**
```yaml
services:
  my_module.event_subscriber:
    class: Drupal\my_module\EventSubscriber\MyEventSubscriber
    tags:
      - { name: event_subscriber }
```

via **attributes**
```php
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;

#[AsEventListener(event: 'kernel.request', priority: 10)]
public function handleRequestEvent(RequestEvent $event): void
{
    // Logic before controller is called
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

**via hook**
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

**via attributes**
```php
namespace Drupal\mymodule\Hook;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;

class FormHooks {

  #[Hook('form_alter')]
  public function alterForm(array &$form, FormStateInterface $form_state, $form_id): void {
    if ($form_id === 'user_register_form') {
      $form['my_custom_field'] = [
        '#type' => 'textfield',
        '#title' => t('My Custom Field'),
      ];
    }
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

## Custom Field Type

```php
namespace Drupal\my_module\Plugin\Field\FieldType;

use Drupal\Core\Field\FieldItemBase;
use Drupal\Core\Field\FieldStorageDefinitionInterface;
use Drupal\Core\TypedData\DataDefinition;

/**
 * Defines a 'example_field' field type.
 *
 * @FieldType(
 *   id = "example_field",
 *   label = @Translation("Example Field"),
 *   description = @Translation("An example field implementation."),
 *   default_widget = "string_textfield",
 *   default_formatter = "string"
 * )
 */
class ExampleFieldItem extends FieldItemBase {
  public static function propertyDefinitions(FieldStorageDefinitionInterface $field_definition) {
    $properties['value'] = DataDefinition::create('string')
      ->setLabel(t('Value'));
    return $properties;
  }

  public function isEmpty() {
    $value = $this->get('value')->getValue();
    return $value === NULL || $value === '';
  }
}
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

## Custom Access Handler

```php
namespace Drupal\my_module;

use Drupal\node\NodeAccessControlHandler;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Access\AccessResult;

class CustomNodeAccessHandler extends NodeAccessControlHandler {
  protected function checkAccess($entity, $operation, AccountInterface $account) {
    if ($operation === 'delete' && $entity->bundle() === 'article') {
      if (!$account->hasPermission('delete articles')) {
        return AccessResult::forbidden();
      }
    }
    return parent::checkAccess($entity, $operation, $account);
  }
}
```

**Override access control via services**
```yaml
services:
  entity_access.node:
    class: Drupal\my_module\CustomNodeAccessHandler
    arguments: ['@entity_type.manager', '@module_handler']
```
---

## Custom Plugin Manager

**Define the Plugin Manager:**
```php
namespace Drupal\my_module\Plugin;

use Drupal\Component\Plugin\PluginManagerInterface;
use Drupal\Core\Plugin\DefaultPluginManager;

class CustomPluginManager extends DefaultPluginManager {
  public function __construct(\Traversable $namespaces, \Drupal\Core\Cache\CacheBackendInterface $cache_backend, \Drupal\Core\Extension\ModuleHandlerInterface $module_handler) {
    parent::__construct(
      'Plugin/CustomPlugin',
      $namespaces,
      $module_handler,
      'Drupal\my_module\Plugin\CustomPluginInterface',
      'Drupal\my_module\Annotation\CustomPlugin'
    );

    $this->alterInfo('custom_plugin_info');
    $this->setCacheBackend($cache_backend, 'custom_plugins');
  }
}

```

**Define the Plugin Interface:**
```php
namespace Drupal\my_module\Plugin;

interface CustomPluginInterface {
  public function process($value);
}
```

**Define the Plugin Annotation:**
```php
namespace Drupal\my_module\Annotation;

use Drupal\Component\Annotation\Plugin;

/**
 * Defines a Custom plugin annotation.
 *
 * @Annotation
 */
class CustomPlugin extends Plugin {
  public $id;
  public $label;
}
```

**Example Implementation**
```php
namespace Drupal\my_module\Plugin\CustomPlugin;

use Drupal\my_module\Plugin\CustomPluginInterface;

/**
 * @CustomPluginExample(
 *   id = "custom_plugin_example",
 *   label = @Translation("Custom Plugin Example")
 * )
 */
class CustomPluginExample implements CustomPluginInterface {
  public function process($value) {
    // Do something...
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

**Cache Context**
```php
namespace Drupal\my_module\Cache;

use Drupal\Core\Cache\CacheContextInterface;
use Drupal\Core\Session\AccountProxyInterface;

class UserRoleCacheContext implements CacheContextInterface {
  protected $currentUser;

  public function __construct(AccountProxyInterface $current_user) {
    $this->currentUser = $current_user;
  }

  public static function getLabel() {
    return t('User role');
  }

  public function getContext() {
    $roles = $this->currentUser->getRoles();
    sort($roles);
    return implode(',', $roles);
  }

  public function getCacheableMetadata() {
    return [];
  }
}
```

**Cache Context registration**
```yaml
services:
  my_module.user_role_cache_context:
    class: Drupal\my_module\Cache\UserRoleCacheContext
    arguments: ['@current_user']
    tags:
      - { name: cache.context, id: 'user_role' }
```

---

### Custom REST endpoint

* Given **RESTful Web Services** module is enabled

```php
namespace Drupal\my_module\Plugin\rest\resource;

use Drupal\rest\Plugin\ResourceBase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Provides a custom REST resource.
 *
 * @RestResource(
 *   id = "custom_rest_resource",
 *   label = @Translation("Custom REST Resource"),
 *   uri_paths = {
 *     "canonical" = "/api/custom-resource"
 *   }
 * )
 */
class CustomRestResource extends ResourceBase {
  public function get() {
    $data = ['message' => 'Hello World'];
    return new ResourceResponse($data);
  }
}
```

---

## Create a node programmatically

```php
use Drupal\node\Entity\Node;

$node = Node::create([
  'type' => 'article',
  'title' => 'Programmatically created node',
  'body' => [
    'value' => 'This node was created using code.',
    'format' => 'basic_html',
  ],
  'status' => 1,
]);
$node->save();
```

---

## Add a custom field programmatically

```php
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field\Entity\FieldConfig;

// Add field storage (field definition)
FieldStorageConfig::create([
  'field_name' => 'custom_field',
  'entity_type' => 'node',
  'type' => 'string',
])->save();

// Attach field to content type
FieldConfig::create([
  'field_name' => 'custom_field',
  'entity_type' => 'node',
  'bundle' => 'article',
  'label' => 'Custom Field',
])->save();
```

---
