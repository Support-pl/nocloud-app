<?php
$FILE_CONFIG_NAME = 'config.js';
$data = [
	[
		"title" => 'WHMCS site url',
		"description" => 'WHMCS site url',
		"name" => 'WHMCSsiteurl',
		"type" => '"%s"'
	],
	[
		"title" => 'app backend folder',
		"description" => 'folder you installed backend',
		"name" => 'appFolder',
		"type" => '"%s"',
		"default" => 'app_back/v1'
	],
	[
		"title" => 'app title',
		"description" => 'title you will see on login screen',
		"name" => 'appTitle',
		"type" => "%s"
	],
	[
		"title" => 'app logo',
		"description" => 'filename with extension or path from ./img, blank if don\'t need',
		"name" => 'appLogo',
		"type" => "%s",
		'default' => ''
	],
	[
		"title" => 'app logo position',
		"description" => 'top, right, bottom, left. Relative position from title. Default: top.',
		"name" => 'appLogoPosition',
		"type" => "%s",
		'default' => 'top'
	],
	[
		"title" => 'currency',
		"description" => 'currency setting of app',
		"name" => 'currency',
		"children" => [
			[
				"title" => "prefix",
				"description" => "prefix you will see before currency",
				"name" => "prefix",
				"type" => '"%s"',
				"default" => ""
			],
			[
				"title" => "suffix",
				"description" => "suffix you will see before currency",
				"name" => "suffix",
				"type" => '"%s"',
				"default" => "USD"
			],
			[
				"title" => "code",
				"description" => "WHMCS money code",
				"name" => "code",
				"type" => '"%s"',
				"default" => "USD"
			],
		]
	],
];



if (file_exists('./' . $FILE_CONFIG_NAME)) {
	$isInstalled = true;
} else {
	$isInstalled = false;
}
$isInstalled = false;

pretty_print($_POST);
$arr = [];
foreach ($_POST as $key => $value) {
	if($key == 'submit') continue;
	if(preg_match('/_/', $key)){
		set_nested_array_value($arr, $key, $value, "_");
	} else {
		$arr[$key] = $_POST[$key];
	}
}
pretty_print($arr);
pretty_print(json_encode($arr, JSON_PRETTY_PRINT));

function pretty_print($data, $dump = false)
{
	echo "<pre>";
	if ($dump) {
		var_dump($data);
	} else {
		print_r($data);
	}
	echo "</pre>";
}

function set_nested_array_value(&$array, $path, &$value, $delimiter = '/'){
	$pathParts = explode($delimiter, $path);

	$current = &$array;
	foreach ($pathParts as $key) {
		$current = &$current[$key];
	}

	$backup = $current;
	$current = $value;

	return $backup;
}

function generateField($field, $path = []){
	array_push($path, $field['name']);
	if (!isset($field['children'])) {
?>
		<div class='form__field'>
			<label>
				<input
					type="<?= $field['type'] == '%d' ? 'number' : 'text' ?>"
					name="<?= implode('.', $path) ?>"
					placeholder="<?= isset($field['default']) ? $field['default'] : '' ?>"
				>
				<span><?= $field['title'] ?></span>
			</label>
		</div>
	<?php
	} else {
	?>
		<p><?= $field['title'] ?></p>
		<div class="form__field-parent">
			<?php
			foreach ($field['children'] as $key => $children) {
				generateField($children, $path);
			}
			?>
		</div>
<?php
	}
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>iONE APP SOLUTION INSTALL</title>
	<style>
		html,
		body {
			margin: 0;
			padding: 0;
		}

		body {
			font-family: sans-serif;
		}

		.container {
			max-width: 1024px;
			margin: 0 auto;
		}

		.fh {
			height: 100%;
		}

		.header {
			background-color: #427cf7;
			color: var(--bright_font);
			height: 64px;
		}

		.logo {
			display: flex;
			align-items: center;
			font-weight: bold;
			font-size: 1.3rem;
		}

		.form__field {
			margin-bottom: 10px;
		}

		.main {
			padding: 20px 0;
		}

		.form__field-parent {
			padding-left: 10px
		}
	</style>
</head>

<body>
	<div class="content">
		<header class="header">
			<div class="container fh">
				<div class="logo fh">
					iONE APP SOLUTION INSTALL
				</div>
			</div>
		</header>

		<main class="main">
			<div class="container">
				<?php if (!$isInstalled) : ?>
					<form method="post" action="">
						<?php foreach ($data as $key => $field) : ?>
							<?php
							generateField($field)
							?>
						<?php endforeach; ?>
						<input type="submit" name="submit">
					</form>
				<?php else : ?>
					<h2>Установлено</h2>
				<?php endif; ?>
			</div>
		</main>
	</div>
</body>

</html>