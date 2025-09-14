<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Enums\UserRole;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add role_id column
            $table->unsignedBigInteger('role_id')->nullable()->after('password');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
        });

        // Migrate existing role data to role_id
        $this->migrateRoleData();

        Schema::table('users', function (Blueprint $table) {
            // Drop old role column
            $table->dropColumn('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add back role column
            $table->string('role')->default(UserRole::STAFF->value)->after('password');
        });

        // Migrate role_id data back to role
        $this->migrateRoleIdData();

        Schema::table('users', function (Blueprint $table) {
            // Drop role_id column
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });
    }

    private function migrateRoleData(): void
    {
        // Get role mappings
        $roleMap = [
            UserRole::OWNER->value => DB::table('roles')->where('name', 'owner')->value('id'),
            UserRole::ADMIN->value => DB::table('roles')->where('name', 'admin')->value('id'),
            UserRole::STAFF->value => DB::table('roles')->where('name', 'staff')->value('id'),
            UserRole::WAREHOUSE->value => DB::table('roles')->where('name', 'warehouse')->value('id'),
        ];

        // Update users with role_id based on their current role
        foreach ($roleMap as $roleName => $roleId) {
            if ($roleId) {
                DB::table('users')
                    ->where('role', $roleName)
                    ->update(['role_id' => $roleId]);
            }
        }
    }

    private function migrateRoleIdData(): void
    {
        // Get role mappings (reverse)
        $roleMap = [
            DB::table('roles')->where('name', 'owner')->value('id') => UserRole::OWNER->value,
            DB::table('roles')->where('name', 'admin')->value('id') => UserRole::ADMIN->value,
            DB::table('roles')->where('name', 'staff')->value('id') => UserRole::STAFF->value,
            DB::table('roles')->where('name', 'warehouse')->value('id') => UserRole::WAREHOUSE->value,
        ];

        // Update users with role based on their role_id
        foreach ($roleMap as $roleId => $roleName) {
            if ($roleId) {
                DB::table('users')
                    ->where('role_id', $roleId)
                    ->update(['role' => $roleName]);
            }
        }
    }
};