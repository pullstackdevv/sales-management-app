import { Icon } from "@iconify/react";
import { Link, usePage } from "@inertiajs/react";

const NavItems = ({ item, onClick }) => {
  const { url } = usePage();
  const currentPath = url || "/";
  const isActive = currentPath === item.url;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link
      href={item.url}
      onClick={handleClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors duration-150 ${
        isActive
          ? "bg-primary text-white shadow-lg"
          : "text-gray-700 hover:bg-gray-100 hover:text-primary"
      }`}
    >
      {item.icon ? (
        <Icon
          icon={item.icon}
          height={20}
          className={`${
            isActive ? "text-white" : "text-gray-500 group-hover:text-primary"
          }`}
        />
      ) : (
        <span
          className={`h-2 w-2 rounded-full ${
            isActive ? "bg-primary" : "bg-gray-400 group-hover:bg-primary"
          }`}
        />
      )}
      <span className="truncate text-sm font-medium">{item.name}</span>
    </Link>
  );
};

export default NavItems;
