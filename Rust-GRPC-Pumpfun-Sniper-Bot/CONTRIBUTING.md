# Contributing to Pump.fun Sniper Bot

Thank you for your interest in contributing to the Pump.fun Sniper Bot! This document provides guidelines for contributing to this project.

## 🤝 How to Contribute

### Reporting Bugs

1. **Check existing issues**: Before creating a new issue, check if the bug has already been reported.
2. **Create a detailed bug report**: Include:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Rust version, etc.)
   - Logs or error messages

### Suggesting Features

1. **Check existing feature requests**: Search for similar feature requests.
2. **Create a feature request**: Include:
   - Clear description of the feature
   - Use cases and benefits
   - Implementation suggestions (if any)

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**: Follow the coding standards below
4. **Test your changes**: Ensure all tests pass
5. **Commit your changes**: Use conventional commit messages
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Create a Pull Request**: Provide a clear description of your changes

## 📋 Coding Standards

### Rust Code Style

- Follow Rust's official style guide
- Use `cargo fmt` to format code
- Use `cargo clippy` to check for common issues
- Write meaningful commit messages

### Code Structure

- Keep functions small and focused
- Use meaningful variable and function names
- Add comments for complex logic
- Follow the existing project structure

### Error Handling

- Use proper error types and `Result<T, E>`
- Provide meaningful error messages
- Handle edge cases appropriately

## 🧪 Testing

### Running Tests

```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific tests
cargo test test_name
```

### Writing Tests

- Write tests for new functionality
- Test both success and failure cases
- Use descriptive test names
- Mock external dependencies when appropriate

## 📝 Documentation

### Code Documentation

- Document public APIs with doc comments
- Include examples in documentation
- Keep documentation up to date

### README Updates

- Update README.md for new features
- Include configuration examples
- Update installation instructions if needed

## 🔧 Development Setup

### Prerequisites

- Rust 1.70+
- Cargo
- Git

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/moonbot777/Sniper-bot-rust.git
   cd Sniper-bot-rust
   ```

2. **Install dependencies**:
   ```bash
   cargo build
   ```

3. **Set up environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Run tests**:
   ```bash
   cargo test
   ```

## 🚀 Pull Request Guidelines

### Before Submitting

1. **Ensure code compiles**: `cargo build`
2. **Run tests**: `cargo test`
3. **Check formatting**: `cargo fmt`
4. **Run clippy**: `cargo clippy`

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Tests added/updated
- [ ] Manual testing performed
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review performed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 📞 Getting Help

- **GitHub Issues**: Create an issue for bugs or feature requests
- **Telegram**: @greenfox for quick questions
- **Discussions**: Use GitHub Discussions for general questions

## 🎯 Areas for Contribution

### High Priority
- Performance optimizations
- Bug fixes
- Security improvements
- Documentation improvements

### Medium Priority
- New DEX integrations
- Additional trading strategies
- UI/UX improvements
- Testing improvements

### Low Priority
- Code refactoring
- Minor feature additions
- Documentation updates

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to the Pump.fun Sniper Bot! 🚀