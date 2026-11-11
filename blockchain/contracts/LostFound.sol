
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract LostFound {

    uint public itemCount;

    struct Item {
        uint id;
        string name;
        string description;
        string location;
        string imageURL;
        string status;
        address reporter;
        address claimant;
    }

    mapping(uint => Item) public items;

    event ItemReported(
        uint id,
        string status,
        address reporter
    );

    event ItemClaimed(
        uint id,
        address claimant
    );

    function reportItem(
        string memory _name,
        string memory _description,
        string memory _location,
        string memory _imageURL,
        string memory _status
    ) public {

        require(
            keccak256(bytes(_status)) ==
            keccak256(bytes("Lost")) ||
            keccak256(bytes(_status)) ==
            keccak256(bytes("Found")),
            "Invalid status"
        );

        itemCount++;

        items[itemCount] = Item(
            itemCount,
            _name,
            _description,
            _location,
            _imageURL,
            _status,
            msg.sender,
            address(0)
        );

        emit ItemReported(
            itemCount,
            _status,
            msg.sender
        );
    }

    function claimItem(uint _id) public {

        require(
            _id > 0 && _id <= itemCount,
            "Invalid item"
        );

        require(
            keccak256(bytes(items[_id].status)) ==
            keccak256(bytes("Found")),
            "Item not available"
        );

        require(
            items[_id].reporter != msg.sender,
            "Cannot claim own item"
        );

        items[_id].claimant = msg.sender;
        items[_id].status = "Claimed";

        emit ItemClaimed(_id, msg.sender);
    }

    function getItem(uint _id)
        public view returns (Item memory)
    {
        require(
            _id > 0 && _id <= itemCount,
            "Invalid item"
        );

        return items[_id];
    }
}
