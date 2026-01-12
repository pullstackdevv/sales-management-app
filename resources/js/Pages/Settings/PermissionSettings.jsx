import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import Swal from "sweetalert2";

export default function PermissionSettings() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("all");

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/permissions");
      setPermissions(response.data.data || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load permissions",
      });
    } finally {
      setLoading(false);
    }
  };

  const modules = [...new Set(permissions.map((p) => p.module))].sort((a, b) => {
    const firstPermissionA = permissions.find((p) => p.module === a);
    const firstPermissionB = permissions.find((p) => p.module === b);
    return (firstPermissionA?.id || 0) - (firstPermissionB?.id || 0);
  });

  // Filter permissions
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule =
      selectedModule === "all" || permission.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  // Group by module
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {});

  const getModuleIcon = (module) => {
    const icons = {
      dashboard: "solar:home-outline",
      orders: "solar:clipboard-list-outline",
      products: "solar:box-outline",
      customers: "solar:users-group-rounded-outline",
      stock: "solar:clipboard-check-outline",
      vouchers: "solar:ticket-outline",
      promotions: "solar:gift-outline",
      expenses: "solar:wallet-money-outline",
      reports: "solar:chart-outline",
      settings: "solar:settings-outline",
    };
    return icons[module] || "solar:shield-check-outline";
  };

  const getModuleBadgeColor = (module) => {
    const colors = {
      dashboard: "bg-blue-100 text-blue-800",
      orders: "bg-green-100 text-green-800",
      products: "bg-purple-100 text-purple-800",
      customers: "bg-pink-100 text-pink-800",
      stock: "bg-yellow-100 text-yellow-800",
      vouchers: "bg-orange-100 text-orange-800",
      promotions: "bg-red-100 text-red-800",
      expenses: "bg-indigo-100 text-indigo-800",
      reports: "bg-teal-100 text-teal-800",
      settings: "bg-gray-100 text-gray-800",
    };
    return colors[module] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Permission Management
        </h2>
        <p className="text-gray-600">
          View all available permissions in the system. Total:{" "}
          {permissions.length} permissions
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              width={20}
            />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Module Filter */}
        <div className="sm:w-64">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Modules</option>
            {modules.map((module) => (
              <option key={module} value={module}>
                {module.charAt(0).toUpperCase() + module.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon
                icon="solar:shield-check-outline"
                className="text-blue-600"
                width={24}
              />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">
                Total Permissions
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {permissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon
                icon="solar:layers-outline"
                className="text-green-600"
                width={24}
              />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Modules</p>
              <p className="text-2xl font-bold text-green-800">
                {modules.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icon
                icon="solar:filter-outline"
                className="text-purple-600"
                width={24}
              />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Filtered</p>
              <p className="text-2xl font-bold text-purple-800">
                {filteredPermissions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions List */}
      {Object.keys(groupedPermissions).length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Icon
            icon="solar:magnifer-bug-outline"
            className="mx-auto text-gray-400 mb-4"
            width={64}
          />
          <p className="text-gray-600">No permissions found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {modules
            .filter((module) => groupedPermissions[module] && groupedPermissions[module].length > 0)
            .map((module) => {
              const perms = groupedPermissions[module];
              return (
            <div
              key={module}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Module Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <Icon
                    icon={getModuleIcon(module)}
                    className="text-gray-600"
                    width={24}
                  />
                  <h3 className="text-lg font-semibold text-gray-800 capitalize">
                    {module}
                  </h3>
                  <span
                    className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${getModuleBadgeColor(
                      module
                    )}`}
                  >
                    {perms.length} permissions
                  </span>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {perms.map((permission) => (
                    <div
                      key={permission.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                          <Icon
                            icon="solar:key-outline"
                            className="text-primary-600"
                            width={20}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 mb-1">
                            {permission.display_name}
                          </p>
                          <p className="text-sm text-gray-500 font-mono break-all">
                            {permission.name}
                          </p>
                          {permission.description && (
                            <p className="text-xs text-gray-400 mt-2">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
