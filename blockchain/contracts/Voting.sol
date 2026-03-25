// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    // Structs
    struct Voter {
        bool hasVoted;
        uint voteWeight;
        string voterId;
        bool isVerified;
    }

    struct Candidate {
        string name;
        string party;
        uint voteCount;
        string symbol;
        uint candidateId;
    }

    struct VotingRound {
        uint startTime;
        uint endTime;
        bool isActive;
        string title;
    }

    // State Variables
    address public admin;
    mapping(address => Voter) public voters;
    mapping(string => Voter) public votersByID;
    Candidate[] public candidates;
    VotingRound public currentRound;
    
    string[] public voterAddresses;
    uint public totalVotes;

    // Events
    event VoterRegistered(string indexed voterId, address indexed voterAddress);
    event FaceVerified(string indexed voterId, address indexed voterAddress);
    event VoteCast(address indexed voter, uint indexed candidateId);
    event CandidateAdded(uint indexed candidateId, string name, string party);
    event VotingRoundCreated(uint startTime, uint endTime);
    event VotingRoundEnded();

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier votingActive() {
        require(currentRound.isActive, "Voting is not active");
        require(block.timestamp >= currentRound.startTime, "Voting has not started");
        require(block.timestamp <= currentRound.endTime, "Voting has ended");
        _;
    }

    modifier onlyVerifiedVoter() {
        require(voters[msg.sender].isVerified, "Voter not verified");
        _;
    }

    // Constructor
    constructor() {
        admin = msg.sender;
        totalVotes = 0;
    }

    // Admin Functions
    function addCandidate(string memory _name, string memory _party, string memory _symbol) 
        public 
        onlyAdmin 
    {
        candidates.push(Candidate({
            name: _name,
            party: _party,
            voteCount: 0,
            symbol: _symbol,
            candidateId: candidates.length
        }));
        emit CandidateAdded(candidates.length - 1, _name, _party);
    }

    function createVotingRound(uint _startTime, uint _endTime, string memory _title)
        public
        onlyAdmin
    {
        require(_startTime < _endTime, "Start time must be before end time");
        currentRound = VotingRound({
            startTime: _startTime,
            endTime: _endTime,
            isActive: true,
            title: _title
        });
        emit VotingRoundCreated(_startTime, _endTime);
    }

    function endVotingRound()
        public
        onlyAdmin
    {
        currentRound.isActive = false;
        emit VotingRoundEnded();
    }

    function resetVoting()
        public
        onlyAdmin
    {
        for (uint i = 0; i < voterAddresses.length; i++) {
            address voterAddr = getAddressFromString(voterAddresses[i]);
            delete voters[voterAddr];
        }
        
        for (uint i = 0; i < candidates.length; i++) {
            candidates[i].voteCount = 0;
        }
        
        delete voterAddresses;
        totalVotes = 0;
    }

    // Voter Registration Functions
    function registerVoter(string memory _voterId, address _voterAddress)
        public
        onlyAdmin
    {
        votersByID[_voterId] = Voter({
            hasVoted: false,
            voteWeight: 1,
            voterId: _voterId,
            isVerified: false
        });
        
        voters[_voterAddress] = Voter({
            hasVoted: false,
            voteWeight: 1,
            voterId: _voterId,
            isVerified: false
        });
        
        voterAddresses.push(addressToString(_voterAddress));
        emit VoterRegistered(_voterId, _voterAddress);
    }

    function verifyVoterFace(string memory _voterId)
        public
    {
        require(compareStrings(voters[msg.sender].voterId, _voterId), "Voter ID mismatch");
        voters[msg.sender].isVerified = true;
        votersByID[_voterId].isVerified = true;
        emit FaceVerified(_voterId, msg.sender);
    }

    // Voting Function
    function vote(uint _candidateId)
        public
        votingActive
        onlyVerifiedVoter
    {
        require(!voters[msg.sender].hasVoted, "Voter has already voted");
        require(_candidateId < candidates.length, "Invalid candidate");

        voters[msg.sender].hasVoted = true;
        candidates[_candidateId].voteCount += voters[msg.sender].voteWeight;
        totalVotes += voters[msg.sender].voteWeight;

        emit VoteCast(msg.sender, _candidateId);
    }

    // View Functions
    function getCandidatesCount()
        public
        view
        returns (uint)
    {
        return candidates.length;
    }

    function getCandidate(uint _index)
        public
        view
        returns (string memory name, string memory party, uint voteCount, string memory symbol, uint candidateId)
    {
        require(_index < candidates.length, "Invalid candidate index");
        Candidate memory candidate = candidates[_index];
        return (candidate.name, candidate.party, candidate.voteCount, candidate.symbol, candidate.candidateId);
    }

    function getAllCandidates()
        public
        view
        returns (Candidate[] memory)
    {
        return candidates;
    }

    function getVoterInfo(address _voterAddress)
        public
        view
        returns (bool hasVoted, bool isVerified, string memory voterId)
    {
        Voter memory voter = voters[_voterAddress];
        return (voter.hasVoted, voter.isVerified, voter.voterId);
    }

    function getTotalVotes()
        public
        view
        returns (uint)
    {
        return totalVotes;
    }

    function getVotingRoundInfo()
        public
        view
        returns (uint startTime, uint endTime, bool isActive, string memory title)
    {
        return (currentRound.startTime, currentRound.endTime, currentRound.isActive, currentRound.title);
    }

    // Helper Functions
    function compareStrings(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function addressToString(address _addr)
        internal
        pure
        returns (string memory)
    {
        bytes32 _bytes = bytes32(uint256(uint160(_addr)));
        bytes memory HEX = "0123456789abcdef";
        bytes memory _string = new bytes(42);
        _string[0] = '0';
        _string[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            _string[2 + i * 2] = HEX[uint8(_bytes[i + 12] >> 4)];
            _string[3 + i * 2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
        }
        return string(_string);
    }

    function getAddressFromString(string memory _str)
        internal
        pure
        returns (address)
    {
        bytes memory _bytes = bytes(_str);
        uint160 _addr = 0;
        for (uint i = 2; i < _bytes.length; i += 2) {
            uint8 digit1 = hexCharToUint8(_bytes[i]);
            uint8 digit2 = hexCharToUint8(_bytes[i + 1]);
            _addr = _addr * 256 + (digit1 * 16 + digit2);
        }
        return address(_addr);
    }

    function hexCharToUint8(bytes1 _char)
        internal
        pure
        returns (uint8)
    {
        uint8 _uint = uint8(_char);
        if (_uint >= 48 && _uint <= 57) {
            return _uint - 48;
        } else if (_uint >= 65 && _uint <= 70) {
            return _uint - 55;
        } else if (_uint >= 97 && _uint <= 102) {
            return _uint - 87;
        }
        return 0;
    }
}