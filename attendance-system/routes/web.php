
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');