import { Button, Dropdown } from "flowbite-react";
import { Icon } from "@iconify/react";
import user1 from "/public/assets/images/profile/user-1.jpg";
import { Link } from "@inertiajs/react";

const Profile = () => {
  return (
    <div className="relative group/menu">
      <Dropdown
        label=""
        className="rounded-sm w-44"
        dismissOnClick={false}
        renderTrigger={() => (
          <span className="h-10 w-10 hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary">
            <img
              src={user1}
              alt="User Avatar"
              height="35"
              width="35"
              className="rounded-full object-cover"
            />
          </span>
        )}
      >
        <Dropdown.Item
          as={Link}
          href="#"
          className="px-3 py-3 flex items-center w-full gap-3 text-dark hover:bg-lightprimary"
        >
          <Icon icon="solar:user-circle-outline" height={20} />
          My Profile
        </Dropdown.Item>

        <Dropdown.Item
          as={Link}
          href="#"
          className="px-3 py-3 flex items-center w-full gap-3 text-dark hover:bg-lightprimary"
        >
          <Icon icon="solar:letter-linear" height={20} />
          My Account
        </Dropdown.Item>

        <Dropdown.Item
          as={Link}
          href="#"
          className="px-3 py-3 flex items-center w-full gap-3 text-dark hover:bg-lightprimary"
        >
          <Icon icon="solar:checklist-linear" height={20} />
          My Task
        </Dropdown.Item>

        <div className="p-3 pt-0">
          <Button
            as={Link}
            href="/auth/login"
            size="sm"
            color="light"
            className="mt-2 border border-primary text-primary bg-transparent hover:bg-lightprimary"
          >
            Logout
          </Button>
        </div>
      </Dropdown>
    </div>
  );
};

export default Profile;
